package com.cognitivediary.model;

/**
 * UserEntity demonstrating encapsulation and polymorphic summary generation.
 */
public class UserEntity extends BaseEntity {
    private String email;
    private String displayName;
    private String timezone;
    private boolean onboardingCompleted;
    private int weeklyHoursBudget;
    private boolean isDemo;

    public UserEntity() {
        super();
        this.timezone = "UTC";
        this.weeklyHoursBudget = 5;
    }

    public UserEntity(String id, String email, String displayName, boolean isDemo) {
        super(id);
        this.email = email;
        this.displayName = displayName;
        this.timezone = "UTC";
        this.weeklyHoursBudget = 5;
        this.isDemo = isDemo;
    }

    @Override
    public String getEntitySummary() {
        return String.format("User [%s]: %s (%s), weekly budget: %dh",
                id, displayName, email, weeklyHoursBudget);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public int getWeeklyHoursBudget() {
        return weeklyHoursBudget;
    }

    public void setWeeklyHoursBudget(int weeklyHoursBudget) {
        this.weeklyHoursBudget = weeklyHoursBudget;
    }

    public boolean isDemo() {
        return isDemo;
    }

    public void setDemo(boolean demo) {
        isDemo = demo;
    }
}
