package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JsonDatabaseService {

    private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final File dbFile = new File("data/cognitive_diary.json");

    // In-memory caching layer backed by persistent atomic disk writes
    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, JournalEntry> entries = new ConcurrentHashMap<>();
    private final Map<String, JournalAnalysis> analyses = new ConcurrentHashMap<>();
    private final Map<String, List<CareerHypothesis>> careers = new ConcurrentHashMap<>();
    private final Map<String, Roadmap> roadmaps = new ConcurrentHashMap<>();
    private final Map<String, List<ProgressEvent>> progressEvents = new ConcurrentHashMap<>();
    private final Map<String, List<WeeklyReport>> weeklyReports = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> skillFeedback = new ConcurrentHashMap<>();

    public JsonDatabaseService() {
        loadFromDisk();
    }

    private synchronized void loadFromDisk() {
        if (!dbFile.exists()) {
            dbFile.getParentFile().mkdirs();
            persistToDisk();
            return;
        }
        try {
            var node = mapper.readTree(dbFile);
            if (node.has("users")) {
                node.get("users").fields().forEachRemaining(entry -> {
                    try {
                        users.put(entry.getKey(), mapper.treeToValue(entry.getValue(), User.class));
                    } catch (Exception ignored) {}
                });
            }
            if (node.has("sessions")) {
                node.get("sessions").fields().forEachRemaining(entry -> {
                    try {
                        sessions.put(entry.getKey(), mapper.treeToValue(entry.getValue(), UserSession.class));
                    } catch (Exception ignored) {}
                });
            }
            if (node.has("entries")) {
                node.get("entries").fields().forEachRemaining(entry -> {
                    try {
                        entries.put(entry.getKey(), mapper.treeToValue(entry.getValue(), JournalEntry.class));
                    } catch (Exception ignored) {}
                });
            }
            if (node.has("analyses")) {
                node.get("analyses").fields().forEachRemaining(entry -> {
                    try {
                        analyses.put(entry.getKey(), mapper.treeToValue(entry.getValue(), JournalAnalysis.class));
                    } catch (Exception ignored) {}
                });
            }
            if (node.has("roadmaps")) {
                node.get("roadmaps").fields().forEachRemaining(entry -> {
                    try {
                        roadmaps.put(entry.getKey(), mapper.treeToValue(entry.getValue(), Roadmap.class));
                    } catch (Exception ignored) {}
                });
            }
        } catch (IOException e) {
            System.err.println("Failed to read database file: " + e.getMessage());
        }
    }

    public synchronized void persistToDisk() {
        try {
            dbFile.getParentFile().mkdirs();
            File tempFile = new File(dbFile.getAbsolutePath() + ".tmp");
            Map<String, Object> root = new HashMap<>();
            root.put("users", users);
            root.put("sessions", sessions);
            root.put("entries", entries);
            root.put("analyses", analyses);
            root.put("careers", careers);
            root.put("roadmaps", roadmaps);
            root.put("progressEvents", progressEvents);
            root.put("weeklyReports", weeklyReports);
            root.put("skillFeedback", skillFeedback);

            mapper.writeValue(tempFile, root);
            Files.move(tempFile.toPath(), dbFile.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            System.err.println("Failed to atomically write database file: " + e.getMessage());
        }
    }

    // Sessions & Access Control
    public String createSession(String userId) {
        String token = "cdt_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String now = Instant.now().toString();
        String expiresAt = Instant.now().plus(30, ChronoUnit.DAYS).toString();
        sessions.put(token, new UserSession(token, userId, now, expiresAt));
        persistToDisk();
        return token;
    }

    public User getSessionUser(String token) {
        if (token == null) return null;
        UserSession s = sessions.get(token);
        if (s == null) return null;
        if (Instant.parse(s.expiresAt()).isBefore(Instant.now())) {
            sessions.remove(token);
            persistToDisk();
            return null;
        }
        return users.get(s.userId());
    }

    public void deleteSession(String token) {
        if (token != null) {
            sessions.remove(token);
            persistToDisk();
        }
    }

    // User Operations
    public User saveUser(User u) {
        users.put(u.id(), u);
        persistToDisk();
        return u;
    }

    public User getUserByEmail(String email) {
        if (email == null) return null;
        String normalized = email.trim().toLowerCase();
        return users.values().stream()
                .filter(u -> u.email() != null && u.email().trim().equalsIgnoreCase(normalized))
                .findFirst()
                .orElse(null);
    }

    public User getUser(String userId) {
        return users.get(userId);
    }

    // Journal CRUD
    public List<JournalEntry> getJournalEntries(String userId) {
        return entries.values().stream()
                .filter(e -> Objects.equals(e.userId(), userId))
                .map(e -> {
                    JournalAnalysis a = analyses.get(e.id());
                    return new JournalEntry(
                            e.id(), e.userId(), e.entryDate(), e.originalText(), e.wordCount(),
                            e.createdAt(), e.updatedAt(), e.analysisStatus(), e.analysisError(),
                            e.analyzedAt(), a, e.isDemo()
                    );
                })
                .sorted((a, b) -> b.entryDate().compareTo(a.entryDate()))
                .toList();
    }

    public JournalEntry getJournalEntry(String userId, String entryId) {
        JournalEntry e = entries.get(entryId);
        if (e == null || !Objects.equals(e.userId(), userId)) return null;
        JournalAnalysis a = analyses.get(entryId);
        return new JournalEntry(
                e.id(), e.userId(), e.entryDate(), e.originalText(), e.wordCount(),
                e.createdAt(), e.updatedAt(), e.analysisStatus(), e.analysisError(),
                e.analyzedAt(), a, e.isDemo()
        );
    }

    public JournalEntry saveJournalEntry(JournalEntry entry) {
        entries.put(entry.id(), entry);
        persistToDisk();
        return entry;
    }

    public boolean deleteJournalEntry(String userId, String entryId) {
        JournalEntry e = entries.get(entryId);
        if (e == null || !Objects.equals(e.userId(), userId)) return false;
        entries.remove(entryId);
        analyses.remove(entryId);
        persistToDisk();
        return true;
    }

    public void saveJournalAnalysis(JournalAnalysis analysis) {
        analyses.put(analysis.journalEntryId(), analysis);
        JournalEntry e = entries.get(analysis.journalEntryId());
        if (e != null) {
            entries.put(e.id(), new JournalEntry(
                    e.id(), e.userId(), e.entryDate(), e.originalText(), e.wordCount(),
                    e.createdAt(), Instant.now().toString(), "completed", null,
                    analysis.createdAt(), analysis, e.isDemo()
            ));
        }
        persistToDisk();
    }

    // Roadmaps
    public Roadmap getRoadmap(String userId) {
        return roadmaps.get(userId);
    }

    public void saveRoadmap(Roadmap r) {
        roadmaps.put(r.userId(), r);
        persistToDisk();
    }

    // Progress Events
    public List<ProgressEvent> getProgressEvents(String userId) {
        return progressEvents.getOrDefault(userId, Collections.emptyList());
    }

    public ProgressEvent saveProgressEvent(ProgressEvent event) {
        List<ProgressEvent> list = progressEvents.computeIfAbsent(event.userId(), k -> new ArrayList<>());
        for (ProgressEvent existing : list) {
            if (Objects.equals(existing.milestoneId(), event.milestoneId()) &&
                Objects.equals(existing.journalEntryId(), event.journalEntryId())) {
                return existing;
            }
        }
        list.add(0, event);
        persistToDisk();
        return event;
    }

    // Wipe Account
    public void deleteUserAccount(String userId) {
        users.remove(userId);
        sessions.entrySet().removeIf(entry -> Objects.equals(entry.getValue().userId(), userId));
        entries.entrySet().removeIf(entry -> Objects.equals(entry.getValue().userId(), userId));
        analyses.entrySet().removeIf(entry -> Objects.equals(entry.getValue().userId(), userId));
        careers.remove(userId);
        roadmaps.remove(userId);
        progressEvents.remove(userId);
        weeklyReports.remove(userId);
        skillFeedback.remove(userId);
        persistToDisk();
    }
}
