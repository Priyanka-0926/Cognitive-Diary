package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class GeminiAiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model.primary:gemini-3.1-flash-lite}")
    private String primaryModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public boolean isConfigured() {
        return apiKey != null && apiKey.trim().length() > 5;
    }

    public JournalAnalysis analyzeEntry(String userId, String entryId, String text, String date) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        String prompt = """
            Analyze the following reflective journal entry written by a knowledge worker.
            Extract:
            1. summary: A 2-3 sentence synthesis of what was accomplished and learned.
            2. skills: List of demonstrated technical and cognitive skills with concrete verbatim evidence quotes.
            3. energyObservations: Activities and whether they were 'energizing', 'draining', or 'neutral'.
            4. workStyleObservations: Observed patterns of work style.
            5. reflectionQuestion: One insightful coaching question.

            Date: %s
            Text:
            \"\"\"%s\"\"\"

            Return purely structured JSON.
            """.formatted(date, text);

        String rawJson = callGemini(primaryModel, prompt);
        JsonNode root = parseJsonSafely(rawJson);

        List<SkillItem> skills = new ArrayList<>();
        if (root.has("skills") && root.get("skills").isArray()) {
            for (JsonNode sn : root.get("skills")) {
                skills.add(new SkillItem(
                        sn.path("name").asText("Observed Competency"),
                        sn.path("evidence").asText(text.substring(0, Math.min(60, text.length()))),
                        sn.path("evidenceType").asText("direct_output"),
                        sn.path("strength").asText("demonstrated"),
                        sn.path("confidence").asDouble(0.85)
                ));
            }
        }

        List<EnergyObservation> energy = new ArrayList<>();
        if (root.has("energyObservations") && root.get("energyObservations").isArray()) {
            for (JsonNode en : root.get("energyObservations")) {
                energy.add(new EnergyObservation(
                        en.path("activity").asText("Project Focus"),
                        en.path("direction").asText("energizing"),
                        en.path("evidence").asText("")
                ));
            }
        }

        return new JournalAnalysis(
                "analysis-" + System.currentTimeMillis(),
                userId,
                entryId,
                root.path("summary").asText("Reflection captured successfully."),
                Collections.emptyList(),
                skills,
                energy,
                Collections.emptyList(),
                Collections.emptyList(),
                root.path("reflectionQuestion").asText("What would you like to build next on this momentum?"),
                primaryModel,
                "v1.3.0",
                Instant.now().toString()
        );
    }

    private String callGemini(String model, String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey.trim();

        Map<String, Object> reqBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        String jsonPayload = mapper.writeValueAsString(reqBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("User-Agent", "cognitive-diary-java")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned status " + response.statusCode() + ": " + response.body());
        }

        JsonNode responseNode = mapper.readTree(response.body());
        return responseNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
    }

    private JsonNode parseJsonSafely(String raw) throws Exception {
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();
        return mapper.readTree(cleaned);
    }
}
