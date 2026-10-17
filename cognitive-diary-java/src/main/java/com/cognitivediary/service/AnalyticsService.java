package com.cognitivediary.service;

import com.cognitivediary.model.Models.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final JsonDatabaseService dbService;

    public AnalyticsService(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    public record EnergySummary(
            int energizingCount,
            int drainingCount,
            int neutralCount,
            double netRatio,
            List<EnergyObservation> topEnergizing,
            List<EnergyObservation> topDraining
    ) {}

    public EnergySummary getEnergyAnalysis(String userId) {
        List<JournalEntry> entries = dbService.getJournalEntries(userId);
        List<EnergyObservation> energizing = new ArrayList<>();
        List<EnergyObservation> draining = new ArrayList<>();
        List<EnergyObservation> neutral = new ArrayList<>();

        for (JournalEntry entry : entries) {
            if (entry.analysis() != null && entry.analysis().energyObservations() != null) {
                for (EnergyObservation obs : entry.analysis().energyObservations()) {
                    if ("energizing".equalsIgnoreCase(obs.direction())) {
                        energizing.add(obs);
                    } else if ("draining".equalsIgnoreCase(obs.direction())) {
                        draining.add(obs);
                    } else {
                        neutral.add(obs);
                    }
                }
            }
        }

        int total = energizing.size() + draining.size() + neutral.size();
        double ratio = total > 0 ? (double) energizing.size() / total : 1.0;

        return new EnergySummary(
                energizing.size(),
                draining.size(),
                neutral.size(),
                ratio,
                energizing.stream().limit(5).toList(),
                draining.stream().limit(5).toList()
        );
    }
}
