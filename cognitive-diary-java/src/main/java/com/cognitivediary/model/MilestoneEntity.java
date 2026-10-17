package com.cognitivediary.model;

import java.util.ArrayList;
import java.util.List;

/**
 * MilestoneEntity demonstrating domain logic, encapsulation, and inheritance.
 */
public class MilestoneEntity extends BaseEntity {
    private String roadmapId;
    private String phaseId;
    private String title;
    private String description;
    private String completionCriteria;
    private List<String> skillsTargeted;
    private String estimatedDuration;
    private String status; // not_started, in_progress, needs_review, completed
    private String completedAt;

    public MilestoneEntity() {
        super();
        this.skillsTargeted = new ArrayList<>();
        this.status = "not_started";
    }

    public MilestoneEntity(String id, String roadmapId, String phaseId, String title, String description) {
        super(id);
        this.roadmapId = roadmapId;
        this.phaseId = phaseId;
        this.title = title;
        this.description = description;
        this.skillsTargeted = new ArrayList<>();
        this.status = "not_started";
    }

    @Override
    public String getEntitySummary() {
        return String.format("Milestone [%s] '%s' (%s) in %s",
                id, title, status, phaseId);
    }

    public String getRoadmapId() {
        return roadmapId;
    }

    public void setRoadmapId(String roadmapId) {
        this.roadmapId = roadmapId;
    }

    public String getPhaseId() {
        return phaseId;
    }

    public void setPhaseId(String phaseId) {
        this.phaseId = phaseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCompletionCriteria() {
        return completionCriteria;
    }

    public void setCompletionCriteria(String completionCriteria) {
        this.completionCriteria = completionCriteria;
    }

    public List<String> getSkillsTargeted() {
        return skillsTargeted;
    }

    public void setSkillsTargeted(List<String> skillsTargeted) {
        this.skillsTargeted = skillsTargeted != null ? skillsTargeted : new ArrayList<>();
    }

    public String getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(String estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }
}
