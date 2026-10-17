package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class JournalService {

    private final JsonDatabaseService dbService;
    private final GeminiAiService aiService;

    public JournalService(JsonDatabaseService dbService, GeminiAiService aiService) {
        this.dbService = dbService;
        this.aiService = aiService;
    }

    public List<JournalEntry> getUserEntries(String userId) {
        if (userId == null) return Collections.emptyList();
        return dbService.getJournalEntries(userId);
    }

    public JournalEntry getEntry(String userId, String entryId) {
        return dbService.getJournalEntry(userId, entryId);
    }

    public JournalEntry createEntry(String userId, String text, String dateStr, boolean isDemo) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Reflection text cannot be empty.");
        }

        String trimmed = text.trim();
        String date = (dateStr != null && !dateStr.isBlank()) ? dateStr : LocalDate.now().toString();

        // 60s duplicate check
        List<JournalEntry> recents = dbService.getJournalEntries(userId);
        for (JournalEntry recent : recents) {
            if (Objects.equals(recent.entryDate(), date) && Objects.equals(recent.originalText(), trimmed)) {
                return recent;
            }
        }

        int words = trimmed.split("\\s+").length;
        String id = "entry-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5);
        String now = Instant.now().toString();

        JournalEntry entry = new JournalEntry(
                id, userId, date, trimmed, words, now, now,
                aiService.isConfigured() ? "analyzing" : "needs_retry",
                aiService.isConfigured() ? null : "Gemini API key is not configured.",
                null, null, isDemo
        );

        dbService.saveJournalEntry(entry);

        if (aiService.isConfigured()) {
            try {
                JournalAnalysis analysis = aiService.analyzeEntry(userId, id, trimmed, date);
                dbService.saveJournalAnalysis(analysis);
                entry = dbService.getJournalEntry(userId, id);
            } catch (Exception ex) {
                entry = new JournalEntry(
                        entry.id(), entry.userId(), entry.entryDate(), entry.originalText(),
                        entry.wordCount(), entry.createdAt(), entry.updatedAt(),
                        "needs_retry", ex.getMessage(), null, null, entry.isDemo()
                );
                dbService.saveJournalEntry(entry);
            }
        }

        return entry;
    }

    public JournalEntry updateEntry(String userId, String entryId, String text, String dateStr) {
        JournalEntry existing = dbService.getJournalEntry(userId, entryId);
        if (existing == null) {
            throw new NoSuchElementException("Entry not found.");
        }

        String trimmed = text.trim();
        String date = (dateStr != null && !dateStr.isBlank()) ? dateStr : existing.entryDate();
        int words = trimmed.split("\\s+").length;

        JournalEntry updated = new JournalEntry(
                existing.id(), existing.userId(), date, trimmed, words,
                existing.createdAt(), Instant.now().toString(),
                aiService.isConfigured() ? "analyzing" : "needs_retry",
                aiService.isConfigured() ? null : "Gemini API key is not configured.",
                existing.analyzedAt(), existing.analysis(), existing.isDemo()
        );

        dbService.saveJournalEntry(updated);

        if (aiService.isConfigured()) {
            try {
                JournalAnalysis analysis = aiService.analyzeEntry(userId, entryId, trimmed, date);
                dbService.saveJournalAnalysis(analysis);
                updated = dbService.getJournalEntry(userId, entryId);
            } catch (Exception ignored) {}
        }

        return updated;
    }

    public boolean deleteEntry(String userId, String entryId) {
        return dbService.deleteJournalEntry(userId, entryId);
    }

    public JournalEntry retryAnalysis(String userId, String entryId) throws Exception {
        JournalEntry existing = dbService.getJournalEntry(userId, entryId);
        if (existing == null) {
            throw new NoSuchElementException("Entry not found.");
        }
        if (!aiService.isConfigured()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        JournalAnalysis analysis = aiService.analyzeEntry(userId, entryId, existing.originalText(), existing.entryDate());
        dbService.saveJournalAnalysis(analysis);
        return dbService.getJournalEntry(userId, entryId);
    }
}
