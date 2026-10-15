package com.cognitivediary.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Models {

    public record UserPreferences(
        boolean remindersEnabled,
        boolean shareDataForAnalysis,
        int weeklyHoursBudget,
        List<String> careerInterests,
        String preferredLearningFormat
    ) {}

    public record User(
        String id,
        String email,
        String displayName,
        String createdAt,
        String timezone,
        boolean onboardingCompleted,
        UserPreferences preferences,
        boolean isDemo
    ) {}

    public record UserSession(
        String token,
        String userId,
        String createdAt,
        String expiresAt
    ) {}

    public record SkillItem(
        String name,
        String evidence,
        String evidenceType,
        String strength,
        double confidence
    ) {}

    public record EnergyObservation(
        String activity,
        String direction, // energizing, draining, neutral
        String evidence
    ) {}

    public record WorkStyleObservation(
        String pattern,
        String evidence,
        String evidenceType,
        double confidence
    ) {}

    public record EmotionObservation(
        String label,
        String evidence,
        double confidence
    ) {}

    public record TaskObservation(
        String title,
        String description,
        String category,
        double timeEstimateHours
    ) {}

    public record JournalAnalysis(
        String id,
        String userId,
        String journalEntryId,
        String summary,
        List<TaskObservation> tasks,
        List<SkillItem> skills,
        List<EnergyObservation> energyObservations,
        List<WorkStyleObservation> workStyleObservations,
        List<EmotionObservation> emotions,
        String reflectionQuestion,
        String modelUsed,
        String promptVersion,
        String createdAt
    ) {}

    public record JournalEntry(
        String id,
        String userId,
        String entryDate,
        String originalText,
        int wordCount,
        String createdAt,
        String updatedAt,
        String analysisStatus, // saved, analyzing, completed, needs_retry
        String analysisError,
        String analyzedAt,
        JournalAnalysis analysis,
        boolean isDemo
    ) {}

    public record EvidenceExcerpt(
        String entryId,
        String entryDate,
        String excerpt,
        String evidenceType,
        double confidence
    ) {}

    public record AggregatedSkill(
        String id,
        String name,
        int frequency,
        double averageConfidence,
        String confidenceCategory,
        Map<String, Integer> evidenceTypes,
        Map<String, Integer> energyCorrelations,
        List<EvidenceExcerpt> evidenceExcerpts,
        String userFeedback
    ) {}

    public record SupportingEvidence(
        String entryId,
        String excerpt,
        String skillName
    ) {}

    public record CareerHypothesis(
        String id,
        String userId,
        String title,
        String description,
        String whyItMayFit,
        List<String> relevantStrengths,
        List<SupportingEvidence> supportingEvidence,
        List<String> potentialEnvironments,
        List<String> typicalTasks,
        List<String> skillsToDevelop,
        List<String> challenges,
        List<String> unknowns,
        List<String> contradictions,
        String smallExperiment,
        List<String> suggestedNextSteps,
        String evidenceStrength,
        String status, // active, saved, dismissed
        String createdAt
    ) {}

    public record Milestone(
        String id,
        String roadmapId,
        String phaseId,
        String title,
        String description,
        String completionCriteria,
        List<String> skillsTargeted,
        List<String> suggestedActivities,
        String estimatedDuration,
        List<String> dependencies,
        String status, // not_started, in_progress, needs_review, completed, skipped
        String completedAt
    ) {}

    public record RoadmapPhase(
        String id,
        String name,
        String description,
        List<Milestone> milestones
    ) {}

    public record Roadmap(
        String id,
        String userId,
        String careerRecommendationId,
        String careerTitle,
        List<RoadmapPhase> phases,
        int weeklyTimeBudget,
        String overallStatus,
        String createdAt,
        String updatedAt
    ) {}

    public record ProgressEvent(
        String id,
        String userId,
        String roadmapId,
        String milestoneId,
        String milestoneTitle,
        String journalEntryId,
        String journalEntryDate,
        String evidenceExcerpt,
        String classification,
        double confidence,
        String proposedAction,
        String userConfirmationStatus, // pending, confirmed, rejected
        String createdAt
    ) {}

    public record WeeklyReport(
        String id,
        String userId,
        String weekStartDate,
        String weekEndDate,
        String summary,
        List<String> keyAccomplishments,
        List<String> topSkillsDemonstrated,
        List<EnergyObservation> energyHighlights,
        String suggestedFocusNextWeek,
        String promptVersion,
        String createdAt
    ) {}
}
