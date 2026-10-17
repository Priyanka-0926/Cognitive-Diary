package com.cognitivediary.model;

/**
 * JournalEntryEntity demonstrating subclass inheritance and polymorphic method overriding.
 */
public class JournalEntryEntity extends BaseEntity {
    private String userId;
    private String entryDate;
    private String originalText;
    private int wordCount;
    private String analysisStatus;
    private String analysisSummary;
    private boolean isDemo;

    public JournalEntryEntity() {
        super();
        this.analysisStatus = "saved";
    }

    public JournalEntryEntity(String id, String userId, String entryDate, String originalText) {
        super(id);
        this.userId = userId;
        this.entryDate = entryDate;
        this.originalText = originalText;
        this.wordCount = (originalText != null && !originalText.trim().isEmpty())
                ? originalText.trim().split("\\s+").length
                : 0;
        this.analysisStatus = "saved";
    }

    // Polymorphic method override
    @Override
    public String getEntitySummary() {
        return String.format("Reflection [%s] on %s: %d words, status: %s",
                id, entryDate, wordCount, analysisStatus);
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(String entryDate) {
        this.entryDate = entryDate;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
        this.wordCount = (originalText != null && !originalText.trim().isEmpty())
                ? originalText.trim().split("\\s+").length
                : 0;
    }

    public int getWordCount() {
        return wordCount;
    }

    public void setWordCount(int wordCount) {
        this.wordCount = wordCount;
    }

    public String getAnalysisStatus() {
        return analysisStatus;
    }

    public void setAnalysisStatus(String analysisStatus) {
        this.analysisStatus = analysisStatus;
    }

    public String getAnalysisSummary() {
        return analysisSummary;
    }

    public void setAnalysisSummary(String analysisSummary) {
        this.analysisSummary = analysisSummary;
    }

    public boolean isDemo() {
        return isDemo;
    }

    public void setDemo(boolean demo) {
        isDemo = demo;
    }
}
