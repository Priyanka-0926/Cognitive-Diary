package com.cognitivediary.controller;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.GeminiAiService;
import com.cognitivediary.service.JsonDatabaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    private final JsonDatabaseService dbService;
    private final GeminiAiService aiService;

    public JournalController(JsonDatabaseService dbService, GeminiAiService aiService) {
        this.dbService = dbService;
        this.aiService = aiService;
    }

    public record JournalPayload(String originalText, String entryDate) {}

    @GetMapping
    public ResponseEntity<?> listEntries(@AuthenticationPrincipal User user) {
        List<JournalEntry> entries = dbService.getJournalEntries(user.id());
        return ResponseEntity.ok(Map.of("entries", entries));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEntry(@AuthenticationPrincipal User user, @PathVariable String id) {
        JournalEntry entry = dbService.getJournalEntry(user.id(), id);
        if (entry == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Journal entry not found"));
        }
        return ResponseEntity.ok(Map.of("entry", entry));
    }

    @PostMapping
    public ResponseEntity<?> createEntry(@AuthenticationPrincipal User user, @RequestBody JournalPayload payload) {
        if (payload.originalText() == null || payload.originalText().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Journal text cannot be empty"));
        }

        String text = payload.originalText().trim();
        String date = payload.entryDate() != null ? payload.entryDate() : LocalDate.now().toString();

        // Deduplicate rapid repeat submissions within 60s
        List<JournalEntry> recents = dbService.getJournalEntries(user.id());
        for (JournalEntry r : recents) {
            if (Objects.equals(r.entryDate(), date) && Objects.equals(r.originalText(), text)) {
                return ResponseEntity.ok(Map.of("entry", r, "deduplicated", true));
            }
        }

        int wordCount = text.split("\\s+").length;
        String entryId = "entry-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4);
        String now = Instant.now().toString();

        JournalEntry newEntry = new JournalEntry(
                entryId, user.id(), date, text, wordCount, now, now,
                aiService.isConfigured() ? "analyzing" : "needs_retry",
                aiService.isConfigured() ? null : "Gemini API key is not configured.",
                null, null, user.isDemo()
        );

        dbService.saveJournalEntry(newEntry);

        if (aiService.isConfigured()) {
            try {
                JournalAnalysis analysis = aiService.analyzeEntry(user.id(), entryId, text, date);
                dbService.saveJournalAnalysis(analysis);
                newEntry = dbService.getJournalEntry(user.id(), entryId);
            } catch (Exception e) {
                // Keep needs_retry without crashing
                newEntry = new JournalEntry(
                        newEntry.id(), newEntry.userId(), newEntry.entryDate(), newEntry.originalText(),
                        newEntry.wordCount(), newEntry.createdAt(), newEntry.updatedAt(),
                        "needs_retry", e.getMessage(), null, null, newEntry.isDemo()
                );
                dbService.saveJournalEntry(newEntry);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("entry", newEntry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEntry(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody JournalPayload payload
    ) {
        JournalEntry existing = dbService.getJournalEntry(user.id(), id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Journal entry not found"));
        }
        if (payload.originalText() == null || payload.originalText().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Journal text cannot be empty"));
        }

        String text = payload.originalText().trim();
        String date = payload.entryDate() != null ? payload.entryDate() : existing.entryDate();
        int wordCount = text.split("\\s+").length;

        JournalEntry updated = new JournalEntry(
                existing.id(), existing.userId(), date, text, wordCount,
                existing.createdAt(), Instant.now().toString(),
                aiService.isConfigured() ? "analyzing" : "needs_retry",
                aiService.isConfigured() ? null : "Gemini API key is not configured.",
                existing.analyzedAt(), existing.analysis(), existing.isDemo()
        );

        dbService.saveJournalEntry(updated);

        if (aiService.isConfigured()) {
            try {
                JournalAnalysis analysis = aiService.analyzeEntry(user.id(), id, text, date);
                dbService.saveJournalAnalysis(analysis);
                updated = dbService.getJournalEntry(user.id(), id);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(Map.of("entry", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(@AuthenticationPrincipal User user, @PathVariable String id) {
        boolean deleted = dbService.deleteJournalEntry(user.id(), id);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Entry not found"));
        }
        return ResponseEntity.ok(Map.of("success", true, "deletedId", id));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<?> retryAnalyze(@AuthenticationPrincipal User user, @PathVariable String id) {
        JournalEntry existing = dbService.getJournalEntry(user.id(), id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Entry not found"));
        }
        if (!aiService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Gemini API key is not configured."));
        }

        try {
            JournalAnalysis analysis = aiService.analyzeEntry(user.id(), id, existing.originalText(), existing.entryDate());
            dbService.saveJournalAnalysis(analysis);
            JournalEntry updated = dbService.getJournalEntry(user.id(), id);
            return ResponseEntity.ok(Map.of("entry", updated, "analysis", analysis));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
