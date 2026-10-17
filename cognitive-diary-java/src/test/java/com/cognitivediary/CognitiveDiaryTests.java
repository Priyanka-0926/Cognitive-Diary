package com.cognitivediary;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class CognitiveDiaryTests {

    @Autowired
    private JsonDatabaseService dbService;

    @Autowired
    private JournalService journalService;

    @Autowired
    private CareerDiscoveryService careerService;

    @Autowired
    private RoadmapService roadmapService;

    private final String testUserId = "test-user-java";

    @BeforeEach
    public void setup() {
        dbService.deleteUserAccount(testUserId);
    }

    @Test
    public void testJournalEntryCreationAndPersistence() {
        JournalEntry entry = journalService.createEntry(
                testUserId,
                "Investigated thread contention issue in message broker using Async-Profiler.",
                "2026-10-16",
                false
        );

        assertNotNull(entry.id());
        assertEquals(testUserId, entry.userId());
        assertTrue(entry.wordCount() > 5);

        JournalEntry retrieved = journalService.getEntry(testUserId, entry.id());
        assertNotNull(retrieved);
        assertEquals(entry.originalText(), retrieved.originalText());
    }

    @Test
    public void testCrossUserIsolation() {
        JournalEntry entryA = journalService.createEntry(testUserId, "Private notes for user A", "2026-10-16", false);

        JournalEntry crossUserFetch = journalService.getEntry("other-unauthorized-user", entryA.id());
        assertNull(crossUserFetch, "Other users must never be able to access entries belonging to user A");
    }

    @Test
    public void testSessionTokenGenerationAndValidation() {
        String token = dbService.createSession(testUserId);
        assertNotNull(token);
        assertTrue(token.startsWith("cdt_"));

        User sessionUser = dbService.getSessionUser(token);
        // If user record exists in db
        dbService.deleteSession(token);
        assertNull(dbService.getSessionUser(token));
    }

    @Test
    public void testCareerHypothesesGeneration() {
        List<CareerHypothesis> hypotheses = careerService.getOrSynthesizeHypotheses(testUserId);
        assertFalse(hypotheses.isEmpty());
        assertTrue(hypotheses.stream().anyMatch(h -> h.title().contains("Architect")));
    }

    @Test
    public void testRoadmapGeneration() {
        Roadmap roadmap = roadmapService.getActiveRoadmap(testUserId);
        assertNotNull(roadmap);
        assertFalse(roadmap.phases().isEmpty());
        assertTrue(roadmap.weeklyTimeBudget() > 0);
    }
}
