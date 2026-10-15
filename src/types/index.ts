export type EvidenceType = 'explicit' | 'inferred';
export type ObservationStrength = 'weak' | 'moderate' | 'strong';
export type EnergyDirection = 'energizing' | 'draining' | 'neutral' | 'mixed' | 'unknown';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'needs_review' | 'completed';
export type ProgressClassification =
  | 'no_progress'
  | 'possible_progress'
  | 'strong_progress'
  | 'milestone_complete'
  | 'possible_blocker';
export type UserFeedbackType = 'accurate' | 'partially_accurate' | 'inaccurate';
export type CareerEvidenceStrength =
  | 'early_hypothesis'
  | 'promising_match'
  | 'supported_by_repeated_observations';

export interface UserPreferences {
  currentRole?: string;
  careerInterests?: string[];
  existingSkills?: string[];
  preferredLearningFormat?: 'hands_on' | 'reading' | 'video' | 'mentorship' | 'mixed';
  weeklyHoursBudget?: number;
  remindersEnabled?: boolean;
  reminderTime?: string;
  shareDataForAnalysis?: boolean;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  timezone: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  isDemo?: boolean;
}

export interface TaskObservation {
  description: string;
  category: string;
  evidence: string;
  estimatedEffort?: string;
}

export interface SkillItem {
  name: string;
  category: string;
  evidence: string;
  evidenceType: EvidenceType;
  confidence: number; // 0 to 1
  strength: ObservationStrength;
}

export interface EnergyObservationItem {
  activity: string;
  direction: EnergyDirection;
  evidence: string;
  evidenceType: EvidenceType;
  confidence: number;
}

export interface WorkStyleObservationItem {
  pattern: string;
  evidence: string;
  evidenceType: EvidenceType;
  confidence: number;
}

export interface EmotionItem {
  label: string;
  evidence: string;
  confidence: number;
}

export interface JournalAnalysis {
  id: string;
  userId: string;
  journalEntryId: string;
  summary: string;
  tasks: TaskObservation[];
  skills: SkillItem[];
  energyObservations: EnergyObservationItem[];
  workStyleObservations: WorkStyleObservationItem[];
  emotions: EmotionItem[];
  reflectionQuestion: string | null;
  modelUsed: string;
  promptVersion?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  entryDate: string; // YYYY-MM-DD
  originalText: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  analysisStatus: 'saved' | 'analyzing' | 'completed' | 'needs_retry';
  analysisError?: string;
  analyzedAt?: string;
  analysis?: JournalAnalysis;
  isDemo?: boolean;
}

export interface AggregatedSkill {
  normalizedId: string;
  name: string;
  category: string;
  frequency: number; // distinct entry count
  totalObservations?: number;
  firstObservedDate: string;
  lastObservedDate: string;
  averageConfidence: number;
  strengthDistribution: {
    weak: number;
    moderate: number;
    strong: number;
  };
  evidenceExcerpts: Array<{
    entryId: string;
    entryDate: string;
    excerpt: string;
    evidenceType: EvidenceType;
    confidence: number;
  }>;
  userFeedback?: UserFeedbackType;
}

export interface CareerHypothesis {
  id: string;
  userId: string;
  title: string;
  description: string;
  whyItMayFit: string;
  relevantStrengths: string[];
  supportingEvidence: Array<{
    entryId: string;
    excerpt: string;
    skillName: string;
  }>;
  potentialEnvironments: string[];
  typicalTasks: string[];
  skillsToDevelop: string[];
  challenges: string[];
  unknowns: string[];
  contradictions?: string[];
  smallExperiment: string;
  suggestedNextSteps: string[];
  evidenceStrength: CareerEvidenceStrength;
  status: 'active' | 'saved' | 'dismissed';
  createdAt: string;
}

export interface Milestone {
  id: string;
  roadmapId: string;
  phaseId: string;
  title: string;
  description: string;
  completionCriteria: string;
  skillsTargeted: string[];
  suggestedActivities: string[];
  estimatedDuration: string;
  dependencies?: string[];
  status: MilestoneStatus;
  completedAt?: string;
  linkedProgressEvents?: ProgressEvent[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  milestones: Milestone[];
}

export interface Roadmap {
  id: string;
  userId: string;
  careerRecommendationId: string;
  careerTitle: string;
  phases: RoadmapPhase[];
  weeklyTimeBudget: number;
  overallStatus: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ProgressEvent {
  id: string;
  userId: string;
  roadmapId: string;
  milestoneId: string;
  milestoneTitle?: string;
  journalEntryId: string;
  journalEntryDate?: string;
  evidenceExcerpt: string;
  classification: ProgressClassification;
  confidence: number;
  proposedAction: string;
  userConfirmationStatus: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface WeeklyReflectionReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  skillsDemonstrated: string[];
  positiveMoments: string[];
  challenges: string[];
  recurringPatterns: string[];
  roadmapProgress: string;
  weeklyQuestion: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'reminder' | 'milestone_progress' | 'weekly_digest' | 'career_discovery';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}
