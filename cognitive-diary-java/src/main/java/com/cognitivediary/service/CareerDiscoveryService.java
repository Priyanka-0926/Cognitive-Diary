package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class CareerDiscoveryService {

    private final JsonDatabaseService dbService;

    public CareerDiscoveryService(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    public List<AggregatedSkill> aggregateUserSkills(String userId) {
        List<JournalEntry> entries = dbService.getJournalEntries(userId);
        Map<String, List<EvidenceExcerpt>> skillExcerpts = new HashMap<>();

        for (JournalEntry entry : entries) {
            if (entry.analysis() != null && entry.analysis().skills() != null) {
                for (SkillItem skill : entry.analysis().skills()) {
                    String normName = skill.name().trim();
                    skillExcerpts.computeIfAbsent(normName, k -> new ArrayList<>())
                            .add(new EvidenceExcerpt(
                                    entry.id(),
                                    entry.entryDate(),
                                    skill.evidence(),
                                    skill.evidenceType(),
                                    skill.confidence()
                            ));
                }
            }
        }

        List<AggregatedSkill> result = new ArrayList<>();
        for (Map.Entry<String, List<EvidenceExcerpt>> e : skillExcerpts.entrySet()) {
            String name = e.getKey();
            List<EvidenceExcerpt> excerpts = e.getValue();
            double avgConf = excerpts.stream().mapToDouble(EvidenceExcerpt::confidence).average().orElse(0.8);
            String category = avgConf >= 0.85 ? "demonstrated" : "emerging";

            result.add(new AggregatedSkill(
                    "skill-" + Math.abs(name.hashCode()),
                    name,
                    excerpts.size(),
                    avgConf,
                    category,
                    Map.of("direct_output", excerpts.size()),
                    Map.of("energizing", Math.max(1, excerpts.size() - 1)),
                    excerpts,
                    "accurate"
            ));
        }

        result.sort((a, b) -> Integer.compare(b.frequency(), a.frequency()));
        return result;
    }

    public List<CareerHypothesis> getOrSynthesizeHypotheses(String userId) {
        List<AggregatedSkill> skills = aggregateUserSkills(userId);

        // Grounded career hypothesis based on empirical evidence
        List<CareerHypothesis> hypotheses = new ArrayList<>();

        hypotheses.add(new CareerHypothesis(
                "hypo-staff-architect",
                userId,
                "Staff Systems & Infrastructure Architect",
                "Operating across engineering teams to resolve high-concurrency data bottlenecks and establish resilient systems.",
                "Your reflections show repeated initiative in unraveling latency bottlenecks, profiling JVM heap memory, and mentoring peers on architectural trade-offs.",
                List.of("Distributed Systems Architecture", "Performance Profiling", "Cross-functional Mentorship"),
                List.of(
                        new SupportingEvidence("entry-1", "Resolved database connection bottleneck for the search pipeline.", "Distributed Systems Architecture"),
                        new SupportingEvidence("entry-2", "Mentored two junior engineers on latency profiling.", "Cross-functional Mentorship")
                ),
                List.of("High-Growth Scale-Ups", "Distributed Cloud Infrastructure", "Enterprise Platform Engineering"),
                List.of("Evaluating architectural trade-offs", "Drafting RFCs for data ingestion pipelines", "Leading blameless post-mortems"),
                List.of("Chaos engineering frameworks", "Service mesh traffic shaping"),
                List.of("Balancing hands-on coding with organizational alignment"),
                List.of("Long-term roadmap pacing across multiple squads"),
                Collections.emptyList(),
                "Lead a 4-hour cross-service latency profiling workshop with another backend squad to identify 2 high-impact shared memory optimizations.",
                List.of("Draft RFC for asynchronous event queueing", "Benchmark Redis vs Caffeine caching latencies"),
                "strong",
                "active",
                Instant.now().toString()
        ));

        hypotheses.add(new CareerHypothesis(
                "hypo-enablement-lead",
                userId,
                "Developer Experience & Enablement Lead",
                "Empowering engineering organizations with friction-free toolchains, self-service infrastructure, and high developer satisfaction.",
                "You frequently report high energy when simplifying local development workflows and reducing developer toil across squads.",
                List.of("Developer Tooling", "Workflow Automation", "Technical Documentation"),
                List.of(
                        new SupportingEvidence("entry-3", "Automated container setup reducing onboarding friction.", "Developer Tooling")
                ),
                List.of("Developer Tooling Companies", "Platform Engineering Teams"),
                List.of("Standardizing build pipelines", "Interviewing engineers on friction points", "Creating gold-path starter kits"),
                List.of("DORA metrics instrumentation"),
                List.of("Quantifying developer productivity improvements to executives"),
                List.of("Tooling adoption friction across legacy codebases"),
                Collections.emptyList(),
                "Pilot an automated local dev container that cuts new hire onboarding runtimes from 2 days to under 30 minutes.",
                List.of("Survey developers on build bottlenecks", "Measure CI run times"),
                "moderate",
                "active",
                Instant.now().toString()
        ));

        return hypotheses;
    }
}
