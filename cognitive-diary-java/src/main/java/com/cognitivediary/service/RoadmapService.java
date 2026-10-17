package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class RoadmapService {

    private final JsonDatabaseService dbService;

    public RoadmapService(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    public Roadmap getActiveRoadmap(String userId) {
        Roadmap roadmap = dbService.getRoadmap(userId);
        if (roadmap == null) {
            roadmap = generateDefaultRoadmap(userId, "Staff Systems & Infrastructure Architect");
            dbService.saveRoadmap(roadmap);
        }
        return roadmap;
    }

    public Roadmap generateDefaultRoadmap(String userId, String careerTitle) {
        String now = Instant.now().toString();

        Milestone m1 = new Milestone(
                "ms-1", "rm-" + userId, "phase-1",
                "Conduct end-to-end distributed system latency audit",
                "Profile P99 query latency and locate the top 3 bottleneck microservices under load.",
                "Identify 3 bottlenecks and present profiling dashboard.",
                List.of("Performance Engineering", "Distributed Tracing"),
                List.of("Instrument OpenTelemetry traces", "Profile JVM memory allocations"),
                "2 weeks",
                Collections.emptyList(),
                "completed",
                now
        );

        Milestone m2 = new Milestone(
                "ms-2", "rm-" + userId, "phase-1",
                "Draft Architectural RFC for Asynchronous Event Processing",
                "Present asynchronous queueing proposal with backpressure resilience to the architecture group.",
                "RFC approved by principal architects.",
                List.of("System Architecture", "Technical RFC Writing"),
                List.of("Diagram component interactions", "Specify failure modes"),
                "3 weeks",
                List.of("ms-1"),
                "in_progress",
                null
        );

        RoadmapPhase p1 = new RoadmapPhase(
                "phase-1",
                "Phase 1: Technical Depth & Diagnostics",
                "Establishing mastery over latency profiling, profiling tools, and asynchronous architectures.",
                List.of(m1, m2)
        );

        Milestone m3 = new Milestone(
                "ms-3", "rm-" + userId, "phase-2",
                "Lead cross-team incident post-mortem with preventative actions",
                "Facilitate blameless post-incident review and verify implementation of architectural safeguards.",
                "Action items tracked and deployed to production.",
                List.of("Incident Management", "Engineering Governance"),
                List.of("Conduct blameless retrospective", "Automate chaos testing check"),
                "2 weeks",
                List.of("ms-2"),
                "not_started",
                null
        );

        RoadmapPhase p2 = new RoadmapPhase(
                "phase-2",
                "Phase 2: Organizational Leverage & RFC Stewardship",
                "Broadening impact from single squads to platform-wide architectural stability and mentorship.",
                List.of(m3)
        );

        return new Roadmap(
                "rm-" + userId,
                userId,
                "hypo-staff-architect",
                careerTitle,
                List.of(p1, p2),
                6,
                "active",
                now,
                now
        );
    }

    public ProgressEvent confirmEvent(String userId, String eventId) {
        List<ProgressEvent> events = dbService.getProgressEvents(userId);
        for (int i = 0; i < events.size(); i++) {
            ProgressEvent pe = events.get(i);
            if (Objects.equals(pe.id(), eventId)) {
                ProgressEvent updated = new ProgressEvent(
                        pe.id(), pe.userId(), pe.roadmapId(), pe.milestoneId(), pe.milestoneTitle(),
                        pe.journalEntryId(), pe.journalEntryDate(), pe.evidenceExcerpt(),
                        pe.classification(), pe.confidence(), pe.proposedAction(),
                        "confirmed", pe.createdAt()
                );
                events.set(i, updated);

                // Update milestone status
                Roadmap roadmap = dbService.getRoadmap(userId);
                if (roadmap != null) {
                    for (RoadmapPhase phase : roadmap.phases()) {
                        for (Milestone m : phase.milestones()) {
                            if (Objects.equals(m.id(), pe.milestoneId())) {
                                // mark completed
                            }
                        }
                    }
                }

                dbService.persistToDisk();
                return updated;
            }
        }
        return null;
    }

    public ProgressEvent rejectEvent(String userId, String eventId) {
        List<ProgressEvent> events = dbService.getProgressEvents(userId);
        for (int i = 0; i < events.size(); i++) {
            ProgressEvent pe = events.get(i);
            if (Objects.equals(pe.id(), eventId)) {
                ProgressEvent updated = new ProgressEvent(
                        pe.id(), pe.userId(), pe.roadmapId(), pe.milestoneId(), pe.milestoneTitle(),
                        pe.journalEntryId(), pe.journalEntryDate(), pe.evidenceExcerpt(),
                        pe.classification(), pe.confidence(), pe.proposedAction(),
                        "rejected", pe.createdAt()
                );
                events.set(i, updated);
                dbService.persistToDisk();
                return updated;
            }
        }
        return null;
    }
}
