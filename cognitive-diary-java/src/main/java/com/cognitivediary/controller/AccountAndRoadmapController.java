package com.cognitivediary.controller;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.JsonDatabaseService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class AccountAndRoadmapController {

    private final JsonDatabaseService dbService;

    public AccountAndRoadmapController(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    // Roadmaps
    @GetMapping("/roadmaps/active")
    public ResponseEntity<?> getActiveRoadmap(@AuthenticationPrincipal User user) {
        Roadmap r = dbService.getRoadmap(user.id());
        return ResponseEntity.ok(Map.of("roadmap", r != null ? r : Optional.empty()));
    }

    // Progress Events
    @GetMapping("/progress-events")
    public ResponseEntity<?> getProgressEvents(@AuthenticationPrincipal User user) {
        List<ProgressEvent> events = dbService.getProgressEvents(user.id());
        return ResponseEntity.ok(Map.of("events", events));
    }

    @PostMapping("/progress-events/{id}/confirm")
    public ResponseEntity<?> confirmProgressEvent(@AuthenticationPrincipal User user, @PathVariable String id) {
        List<ProgressEvent> events = dbService.getProgressEvents(user.id());
        for (int i = 0; i < events.size(); i++) {
            ProgressEvent pe = events.get(i);
            if (Objects.equals(pe.id(), id)) {
                ProgressEvent updated = new ProgressEvent(
                        pe.id(), pe.userId(), pe.roadmapId(), pe.milestoneId(), pe.milestoneTitle(),
                        pe.journalEntryId(), pe.journalEntryDate(), pe.evidenceExcerpt(),
                        pe.classification(), pe.confidence(), pe.proposedAction(),
                        "confirmed", pe.createdAt()
                );
                events.set(i, updated);
                dbService.persistToDisk();
                return ResponseEntity.ok(Map.of("event", updated, "roadmap", dbService.getRoadmap(user.id())));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
    }

    @PostMapping("/progress-events/{id}/reject")
    public ResponseEntity<?> rejectProgressEvent(@AuthenticationPrincipal User user, @PathVariable String id) {
        List<ProgressEvent> events = dbService.getProgressEvents(user.id());
        for (int i = 0; i < events.size(); i++) {
            ProgressEvent pe = events.get(i);
            if (Objects.equals(pe.id(), id)) {
                ProgressEvent updated = new ProgressEvent(
                        pe.id(), pe.userId(), pe.roadmapId(), pe.milestoneId(), pe.milestoneTitle(),
                        pe.journalEntryId(), pe.journalEntryDate(), pe.evidenceExcerpt(),
                        pe.classification(), pe.confidence(), pe.proposedAction(),
                        "rejected", pe.createdAt()
                );
                events.set(i, updated);
                dbService.persistToDisk();
                return ResponseEntity.ok(Map.of("event", updated));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
    }

    // Data Export
    @GetMapping("/user/export")
    public ResponseEntity<?> exportUserData(@AuthenticationPrincipal User user) {
        Map<String, Object> archive = new HashMap<>();
        archive.put("user", user);
        archive.put("entries", dbService.getJournalEntries(user.id()));
        archive.put("roadmap", dbService.getRoadmap(user.id()));
        archive.put("progressEvents", dbService.getProgressEvents(user.id()));
        archive.put("exportedAt", System.currentTimeMillis());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cognitive-diary-" + user.id() + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(archive);
    }

    // Account Deletion
    @PostMapping("/user/delete")
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal User user) {
        dbService.deleteUserAccount(user.id());
        return ResponseEntity.ok(Map.of("success", true, "message", "Account and all journal records permanently deleted."));
    }
}
