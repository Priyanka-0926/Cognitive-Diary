import fs from 'fs';
import path from 'path';
import {
  User,
  JournalEntry,
  JournalAnalysis,
  AggregatedSkill,
  CareerHypothesis,
  Roadmap,
  ProgressEvent,
  WeeklyReflectionReport,
  UserFeedbackType,
  MilestoneStatus,
} from '../src/types/index.ts';

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  users: Record<string, User>;
  sessions: Record<string, UserSession>; // token -> session
  entries: Record<string, JournalEntry>;
  analyses: Record<string, JournalAnalysis>;
  skillFeedback: Record<string, Record<string, UserFeedbackType>>; // userId -> skillId -> feedback
  careers: Record<string, CareerHypothesis[]>; // userId -> careers
  roadmaps: Record<string, Roadmap>; // userId -> active roadmap
  progressEvents: Record<string, ProgressEvent[]>; // userId -> events
  weeklyReports: Record<string, WeeklyReflectionReport[]>; // userId -> reports
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cognitive_diary.json');

// Ensure database directory exists
function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      users: {},
      sessions: {},
      entries: {},
      analyses: {},
      skillFeedback: {},
      careers: {},
      roadmaps: {},
      progressEvents: {},
      weeklyReports: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

export function readDb(): DatabaseSchema {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.sessions) parsed.sessions = {};
    return parsed;
  } catch (err) {
    console.error('Error reading database file, fallback to empty:', err);
    return {
      users: {},
      sessions: {},
      entries: {},
      analyses: {},
      skillFeedback: {},
      careers: {},
      roadmaps: {},
      progressEvents: {},
      weeklyReports: {},
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  ensureStorage();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// User CRUD
export function getUser(userId: string): User | null {
  const db = readDb();
  return db.users[userId] || null;
}

export function getUserByEmail(email: string): User | null {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  for (const user of Object.values(db.users)) {
    if (user.email.toLowerCase().trim() === normalized) {
      return user;
    }
  }
  return null;
}

export function saveUser(user: User): User {
  const db = readDb();
  db.users[user.id] = user;
  writeDb(db);
  return user;
}

// Journal Entry CRUD
export function getJournalEntries(userId: string): JournalEntry[] {
  const db = readDb();
  const userEntries = Object.values(db.entries).filter(
    (e) => e.userId === userId
  );

  // Attach analyses
  const enriched = userEntries.map((e) => {
    const analysis = db.analyses[e.id];
    return {
      ...e,
      analysis: analysis || undefined,
    };
  });

  return enriched.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

export function getJournalEntry(userId: string, entryId: string): JournalEntry | null {
  const db = readDb();
  const entry = db.entries[entryId];
  if (!entry || entry.userId !== userId) return null;
  const analysis = db.analyses[entryId];
  return {
    ...entry,
    analysis: analysis || undefined,
  };
}

export function saveJournalEntry(entry: JournalEntry): JournalEntry {
  const db = readDb();
  db.entries[entry.id] = entry;
  writeDb(db);
  return entry;
}

export function deleteJournalEntry(userId: string, entryId: string): boolean {
  const db = readDb();
  const entry = db.entries[entryId];
  if (!entry || entry.userId !== userId) return false;

  delete db.entries[entryId];
  delete db.analyses[entryId];

  // Clean up any progress events referencing this entry
  if (db.progressEvents[userId]) {
    db.progressEvents[userId] = db.progressEvents[userId].filter(
      (ev) => ev.journalEntryId !== entryId
    );
  }

  writeDb(db);
  return true;
}

// Journal Analysis CRUD
export function saveJournalAnalysis(analysis: JournalAnalysis): JournalAnalysis {
  const db = readDb();
  db.analyses[analysis.journalEntryId] = analysis;
  if (db.entries[analysis.journalEntryId]) {
    db.entries[analysis.journalEntryId].analysisStatus = 'completed';
    db.entries[analysis.journalEntryId].analyzedAt = analysis.createdAt;
    db.entries[analysis.journalEntryId].analysisError = undefined;
  }
  writeDb(db);
  return analysis;
}

export function markAnalysisStatus(
  userId: string,
  entryId: string,
  status: 'saved' | 'analyzing' | 'completed' | 'needs_retry',
  errorMessage?: string
): void {
  const db = readDb();
  const entry = db.entries[entryId];
  if (entry && entry.userId === userId) {
    entry.analysisStatus = status;
    if (errorMessage) {
      entry.analysisError = errorMessage;
    } else {
      entry.analysisError = undefined;
    }
    writeDb(db);
  }
}

// Longitudinal Skill Aggregation
export function getAggregatedSkills(userId: string): AggregatedSkill[] {
  const db = readDb();
  const userEntries = Object.values(db.entries).filter((e) => e.userId === userId);
  const userFeedbackMap = db.skillFeedback[userId] || {};

  const skillMap: Record<string, {
    normalizedId: string;
    name: string;
    category: string;
    confidences: number[];
    strengthDistribution: { weak: number; moderate: number; strong: number };
    excerpts: Array<{
      entryId: string;
      entryDate: string;
      excerpt: string;
      evidenceType: 'explicit' | 'inferred';
      confidence: number;
    }>;
    distinctEntryIds: Set<string>;
    dates: Set<string>;
  }> = {};

  for (const entry of userEntries) {
    const analysis = db.analyses[entry.id];
    if (!analysis || !analysis.skills) continue;

    // Longitudinal Aggregation Rule: Prevent duplicate skills within a single entry or repeated runs
    // from inflating frequencies or distorting confidences. Collect unique skills per entry first.
    const entrySkillsMap = new Map<string, typeof analysis.skills[0]>();
    for (const skill of analysis.skills) {
      const normalizedId = skill.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      if (!entrySkillsMap.has(normalizedId)) {
        entrySkillsMap.set(normalizedId, skill);
      } else {
        const existing = entrySkillsMap.get(normalizedId)!;
        // Keep the one with higher confidence or longer evidence
        if (
          skill.confidence > existing.confidence ||
          (skill.confidence === existing.confidence && skill.evidence.length > existing.evidence.length)
        ) {
          entrySkillsMap.set(normalizedId, skill);
        }
      }
    }

    for (const [normalizedId, skill] of entrySkillsMap.entries()) {
      if (!skillMap[normalizedId]) {
        skillMap[normalizedId] = {
          normalizedId,
          name: skill.name,
          category: skill.category || 'General',
          confidences: [],
          strengthDistribution: { weak: 0, moderate: 0, strong: 0 },
          excerpts: [],
          distinctEntryIds: new Set<string>(),
          dates: new Set<string>(),
        };
      }

      const item = skillMap[normalizedId];
      item.confidences.push(skill.confidence);
      item.strengthDistribution[skill.strength] = (item.strengthDistribution[skill.strength] || 0) + 1;
      item.distinctEntryIds.add(entry.id);
      item.dates.add(entry.entryDate);

      const alreadyHasExcerpt = item.excerpts.some((ex) => ex.entryId === entry.id);
      if (!alreadyHasExcerpt) {
        item.excerpts.push({
          entryId: entry.id,
          entryDate: entry.entryDate,
          excerpt: skill.evidence,
          evidenceType: skill.evidenceType,
          confidence: skill.confidence,
        });
      }
    }
  }

  const result: AggregatedSkill[] = Object.values(skillMap).map((item) => {
    const sortedDates = Array.from(item.dates).sort();
    const avgConfidence = item.confidences.reduce((a, b) => a + b, 0) / (item.confidences.length || 1);
    return {
      normalizedId: item.normalizedId,
      name: item.name,
      category: item.category,
      frequency: item.distinctEntryIds.size, // distinct entry count strictly
      totalObservations: item.excerpts.length,
      firstObservedDate: sortedDates[0] || '',
      lastObservedDate: sortedDates[sortedDates.length - 1] || '',
      averageConfidence: Number(avgConfidence.toFixed(2)),
      strengthDistribution: item.strengthDistribution,
      evidenceExcerpts: item.excerpts,
      userFeedback: userFeedbackMap[item.normalizedId],
    };
  });

  return result.sort((a, b) => b.frequency - a.frequency);
}

export function saveSkillFeedback(
  userId: string,
  skillId: string,
  feedback: UserFeedbackType
): void {
  const db = readDb();
  if (!db.skillFeedback[userId]) {
    db.skillFeedback[userId] = {};
  }
  db.skillFeedback[userId][skillId] = feedback;
  writeDb(db);
}

// Career Hypotheses CRUD
export function getCareerHypotheses(userId: string): CareerHypothesis[] {
  const db = readDb();
  return db.careers[userId] || [];
}

export function saveCareerHypotheses(userId: string, hypotheses: CareerHypothesis[]): void {
  const db = readDb();
  db.careers[userId] = hypotheses;
  writeDb(db);
}

export function updateCareerStatus(
  userId: string,
  careerId: string,
  status: 'active' | 'saved' | 'dismissed'
): void {
  const db = readDb();
  const list = db.careers[userId] || [];
  const item = list.find((c) => c.id === careerId);
  if (item) {
    item.status = status;
    writeDb(db);
  }
}

// Roadmap CRUD
export function getRoadmap(userId: string): Roadmap | null {
  const db = readDb();
  return db.roadmaps[userId] || null;
}

export function saveRoadmap(roadmap: Roadmap): Roadmap {
  const db = readDb();
  db.roadmaps[roadmap.userId] = roadmap;
  writeDb(db);
  return roadmap;
}

export function updateMilestoneStatus(
  userId: string,
  roadmapId: string,
  milestoneId: string,
  status: MilestoneStatus
): Roadmap | null {
  const db = readDb();
  const roadmap = db.roadmaps[userId];
  if (!roadmap || roadmap.id !== roadmapId) return null;

  for (const phase of roadmap.phases) {
    for (const m of phase.milestones) {
      if (m.id === milestoneId) {
        m.status = status;
        if (status === 'completed') {
          m.completedAt = new Date().toISOString();
        } else {
          m.completedAt = undefined;
        }
        roadmap.updatedAt = new Date().toISOString();
        writeDb(db);
        return roadmap;
      }
    }
  }

  return null;
}

// Progress Events
export function getProgressEvents(userId: string): ProgressEvent[] {
  const db = readDb();
  return (db.progressEvents[userId] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveProgressEvent(event: ProgressEvent): ProgressEvent {
  const db = readDb();
  if (!db.progressEvents[event.userId]) {
    db.progressEvents[event.userId] = [];
  }
  // Idempotency: avoid duplicate event for same entry and milestone
  const existing = db.progressEvents[event.userId].find(
    (e) => e.milestoneId === event.milestoneId && e.journalEntryId === event.journalEntryId
  );
  if (existing) {
    return existing;
  }
  db.progressEvents[event.userId].unshift(event);
  writeDb(db);
  return event;
}

export function updateProgressEventStatus(
  userId: string,
  eventId: string,
  status: 'confirmed' | 'rejected'
): ProgressEvent | null {
  const db = readDb();
  const list = db.progressEvents[userId] || [];
  const event = list.find((e) => e.id === eventId);
  if (!event) return null;

  event.userConfirmationStatus = status;

  // If confirmed and proposed action was milestone completion, complete the milestone
  if (status === 'confirmed' && event.proposedAction === 'complete_milestone') {
    const roadmap = db.roadmaps[userId];
    if (roadmap) {
      for (const phase of roadmap.phases) {
        for (const m of phase.milestones) {
          if (m.id === event.milestoneId) {
            m.status = 'completed';
            m.completedAt = new Date().toISOString();
            roadmap.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  } else if (status === 'confirmed' && event.proposedAction === 'mark_in_progress') {
    const roadmap = db.roadmaps[userId];
    if (roadmap) {
      for (const phase of roadmap.phases) {
        for (const m of phase.milestones) {
          if (m.id === event.milestoneId && m.status === 'not_started') {
            m.status = 'in_progress';
            roadmap.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  } else if (status === 'rejected') {
    const roadmap = db.roadmaps[userId];
    if (roadmap) {
      for (const phase of roadmap.phases) {
        for (const m of phase.milestones) {
          if (m.id === event.milestoneId && m.status === 'needs_review') {
            m.status = 'in_progress';
            roadmap.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  }

  writeDb(db);
  return event;
}

// Weekly Reflection Reports
export function getWeeklyReports(userId: string): WeeklyReflectionReport[] {
  const db = readDb();
  return (db.weeklyReports[userId] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveWeeklyReport(report: WeeklyReflectionReport): WeeklyReflectionReport {
  const db = readDb();
  if (!db.weeklyReports[report.userId]) {
    db.weeklyReports[report.userId] = [];
  }
  db.weeklyReports[report.userId].unshift(report);
  writeDb(db);
  return report;
}

// Data Export & Account Deletion
export function exportUserData(userId: string): Record<string, unknown> {
  const db = readDb();
  return {
    user: db.users[userId] || null,
    entries: Object.values(db.entries).filter((e) => e.userId === userId),
    analyses: Object.values(db.analyses).filter((a) => a.userId === userId),
    skills: getAggregatedSkills(userId),
    careers: db.careers[userId] || [],
    roadmap: db.roadmaps[userId] || null,
    progressEvents: db.progressEvents[userId] || [],
    weeklyReports: db.weeklyReports[userId] || [],
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };
}

// Session Management
export function createSession(userId: string): string {
  const db = readDb();
  if (!db.sessions) db.sessions = {};
  const token = `cdt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions[token] = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  writeDb(db);
  return token;
}

export function getSessionUser(token: string): User | null {
  if (!token || typeof token !== 'string') return null;
  const db = readDb();
  if (!db.sessions) return null;
  const session = db.sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete db.sessions[token];
    writeDb(db);
    return null;
  }
  return db.users[session.userId] || null;
}

export function deleteSession(token: string): void {
  const db = readDb();
  if (db.sessions && db.sessions[token]) {
    delete db.sessions[token];
    writeDb(db);
  }
}

export function deleteUserSessions(userId: string): void {
  const db = readDb();
  if (!db.sessions) return;
  let modified = false;
  for (const [token, session] of Object.entries(db.sessions)) {
    if (session.userId === userId) {
      delete db.sessions[token];
      modified = true;
    }
  }
  if (modified) writeDb(db);
}

export function deleteUserAccount(userId: string): boolean {
  const db = readDb();
  delete db.users[userId];

  // Delete all entries and analyses
  for (const [id, entry] of Object.entries(db.entries)) {
    if (entry.userId === userId) {
      delete db.entries[id];
      delete db.analyses[id];
    }
  }

  delete db.skillFeedback[userId];
  delete db.careers[userId];
  delete db.roadmaps[userId];
  delete db.progressEvents[userId];
  delete db.weeklyReports[userId];

  // Revoke all sessions for this user
  if (db.sessions) {
    for (const [token, session] of Object.entries(db.sessions)) {
      if (session.userId === userId) {
        delete db.sessions[token];
      }
    }
  }

  writeDb(db);
  return true;
}

// Seed Demo User with realistic, high-fidelity data
export const DEMO_USER_ID = 'demo-user-elena-vance';

export function seedDemoData(): User {
  const db = readDb();

  const demoUser: User = {
    id: DEMO_USER_ID,
    displayName: 'Elena Vance',
    email: 'elena.vance@example.com',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    timezone: 'America/New_York',
    onboardingCompleted: true,
    isDemo: true,
    preferences: {
      currentRole: 'Software Developer & Technical Explorer',
      careerInterests: ['Product Engineering', 'Systems Architecture', 'Developer Experience'],
      existingSkills: ['TypeScript', 'React', 'Problem Solving'],
      preferredLearningFormat: 'hands_on',
      weeklyHoursBudget: 6,
      remindersEnabled: true,
      shareDataForAnalysis: true,
    },
  };

  db.users[DEMO_USER_ID] = demoUser;

  // 5 Realistic, Traceable Journal Entries
  const entries: JournalEntry[] = [
    {
      id: 'demo-entry-1',
      userId: DEMO_USER_ID,
      entryDate: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
      originalText:
        'Spent three hours debugging a race condition in our client state synchronizer. I was frustrated at first because the error only reproduced on intermittent network spikes, but when I stepped through the concurrency traces and found the missing queue lock, it felt deeply satisfying. Isolating the root cause made the entire afternoon worth it.',
      wordCount: 57,
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      analysisStatus: 'completed',
      analyzedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-entry-2',
      userId: DEMO_USER_ID,
      entryDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      originalText:
        'Attended a two-hour roadmap alignment meeting with cross-functional stakeholders. The circular debate over vague feature requests was exhausting and left me feeling drained. But afterwards, I grabbed a whiteboard and sketched a clear visual user flow linking customer pain points to technical trade-offs. Once everyone could see the journey visually, the tension dissolved.',
      wordCount: 58,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      analysisStatus: 'completed',
      analyzedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-entry-3',
      userId: DEMO_USER_ID,
      entryDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      originalText:
        'Analyzed SQL query logs and user drop-off metrics from last week’s checkout release. I noticed an anomaly where users stalled right before payment confirmation. Rather than just filing a bug ticket, I wrote a one-page synthesis explaining the UX hurdle and suggested a cleaner fallback flow. Digging into the raw data and turning it into a tangible design solution energized me.',
      wordCount: 66,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      analysisStatus: 'completed',
      analyzedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-entry-4',
      userId: DEMO_USER_ID,
      entryDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      originalText:
        'Paired for an hour with a junior frontend engineer who was struggling to understand asynchronous error boundaries in React. Instead of just fixing it for them, we drew out how errors propagate up the component tree and built an interactive sandbox example together. Seeing their eyes light up when the concept clicked reminded me how much I love teaching and translating complex ideas.',
      wordCount: 68,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      analysisStatus: 'completed',
      analyzedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-entry-5',
      userId: DEMO_USER_ID,
      entryDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      originalText:
        'Today I built a complete working prototype of the milestone verification panel with responsive touch states and real data bindings. I tested edge cases like empty states and server timeouts, ensuring the feedback loops feel instant. Shipping a real, usable vertical slice in a single focused day felt fantastic.',
      wordCount: 52,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      analysisStatus: 'completed',
      analyzedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      isDemo: true,
    },
  ];

  for (const entry of entries) {
    db.entries[entry.id] = entry;
  }

  // Analyses corresponding to entries
  const analyses: Record<string, JournalAnalysis> = {
    'demo-entry-1': {
      id: 'analysis-1',
      userId: DEMO_USER_ID,
      journalEntryId: 'demo-entry-1',
      summary:
        'Investigated and resolved a complex intermittent race condition in client-side state synchronization, feeling energized by finding the root cause.',
      tasks: [
        {
          description: 'Traced concurrency race condition under network spikes',
          category: 'Debugging & Diagnostics',
          evidence: 'stepped through the concurrency traces and found the missing queue lock',
        },
      ],
      skills: [
        {
          name: 'Root Cause Analysis',
          category: 'Analytical',
          evidence: 'Isolating the root cause made the entire afternoon worth it',
          evidenceType: 'explicit',
          confidence: 0.94,
          strength: 'strong',
        },
        {
          name: 'Systems Diagnostics',
          category: 'Technical',
          evidence: 'stepped through concurrency traces and found missing queue lock',
          evidenceType: 'explicit',
          confidence: 0.91,
          strength: 'strong',
        },
        {
          name: 'Debugging Persistence',
          category: 'Execution',
          evidence: 'Spent three hours debugging a race condition... frustrated at first',
          evidenceType: 'inferred',
          confidence: 0.85,
          strength: 'moderate',
        },
      ],
      energyObservations: [
        {
          activity: 'Finding root cause of complex technical flaw',
          direction: 'energizing',
          evidence: 'when I found the missing queue lock, it felt deeply satisfying',
          evidenceType: 'explicit',
          confidence: 0.96,
        },
      ],
      workStyleObservations: [
        {
          pattern: 'Deep focus on intricate causal puzzles',
          evidence: 'Spent three hours debugging... stepped through concurrency traces',
          evidenceType: 'inferred',
          confidence: 0.88,
        },
      ],
      emotions: [
        { label: 'Satisfaction', evidence: 'felt deeply satisfying', confidence: 0.95 },
        { label: 'Initial Frustration', evidence: 'I was frustrated at first', confidence: 0.9 },
      ],
      reflectionQuestion:
        'What specific tools or mental models helped you eliminate the other variables during concurrency tracing?',
      modelUsed: 'gemini-3.8-flash',
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    'demo-entry-2': {
      id: 'analysis-2',
      userId: DEMO_USER_ID,
      journalEntryId: 'demo-entry-2',
      summary:
        'Navigated an unproductive debate by translating ambiguous requirements into a visual customer journey, bridging business and technical teams.',
      tasks: [
        {
          description: 'Attended stakeholder alignment meeting',
          category: 'Coordination',
          evidence: 'Attended a two-hour roadmap alignment meeting with cross-functional stakeholders',
        },
        {
          description: 'Diagrammed user journey and technical trade-offs on whiteboard',
          category: 'Product Design',
          evidence: 'sketched a clear visual user flow linking customer pain points to technical trade-offs',
        },
      ],
      skills: [
        {
          name: 'User Journey Mapping',
          category: 'Creative',
          evidence: 'sketched a clear visual user flow linking customer pain points to technical trade-offs',
          evidenceType: 'explicit',
          confidence: 0.92,
          strength: 'strong',
        },
        {
          name: 'Cross-Functional Translation',
          category: 'Communication',
          evidence: 'Once everyone could see the journey visually, the tension dissolved',
          evidenceType: 'explicit',
          confidence: 0.89,
          strength: 'strong',
        },
        {
          name: 'Facilitation & Consensus',
          category: 'Interpersonal',
          evidence: 'the tension dissolved once everyone could see the journey',
          evidenceType: 'inferred',
          confidence: 0.82,
          strength: 'moderate',
        },
      ],
      energyObservations: [
        {
          activity: 'Unstructured circular debate over vague features',
          direction: 'draining',
          evidence: 'The circular debate over vague feature requests was exhausting and left me feeling drained',
          evidenceType: 'explicit',
          confidence: 0.98,
        },
        {
          activity: 'Visual modeling to bring clarity to team ambiguity',
          direction: 'energizing',
          evidence: 'sketched a clear visual user flow... tension dissolved',
          evidenceType: 'inferred',
          confidence: 0.85,
        },
      ],
      workStyleObservations: [
        {
          pattern: 'Visual thinking to resolve cognitive ambiguity',
          evidence: 'grabbed a whiteboard and sketched a clear visual user flow',
          evidenceType: 'explicit',
          confidence: 0.91,
        },
      ],
      emotions: [
        { label: 'Exhaustion', evidence: 'left me feeling drained', confidence: 0.95 },
        { label: 'Relief & Clarity', evidence: 'the tension dissolved', confidence: 0.88 },
      ],
      reflectionQuestion:
        'How might you introduce visual artifacts earlier in stakeholder conversations to prevent circular debates?',
      modelUsed: 'gemini-3.8-flash',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    'demo-entry-3': {
      id: 'analysis-3',
      userId: DEMO_USER_ID,
      journalEntryId: 'demo-entry-3',
      summary:
        'Explored SQL telemetry drop-offs, identifying a UX stumbling block and authoring an actionable design synthesis.',
      tasks: [
        {
          description: 'Queried SQL logs for drop-off anomalies in checkout flow',
          category: 'Data Analytics',
          evidence: 'Analyzed SQL query logs and user drop-off metrics',
        },
        {
          description: 'Authored one-page synthesis with solution recommendations',
          category: 'Technical Writing',
          evidence: 'wrote a one-page synthesis explaining the UX hurdle and suggested a cleaner fallback flow',
        },
      ],
      skills: [
        {
          name: 'Data-Informed UX Analysis',
          category: 'Analytical',
          evidence: 'noticed an anomaly where users stalled... suggested a cleaner fallback flow',
          evidenceType: 'explicit',
          confidence: 0.93,
          strength: 'strong',
        },
        {
          name: 'SQL Exploration',
          category: 'Technical',
          evidence: 'Analyzed SQL query logs and user drop-off metrics',
          evidenceType: 'explicit',
          confidence: 0.88,
          strength: 'moderate',
        },
        {
          name: 'Synthesis & Technical Writing',
          category: 'Communication',
          evidence: 'wrote a one-page synthesis explaining the UX hurdle',
          evidenceType: 'explicit',
          confidence: 0.9,
          strength: 'strong',
        },
      ],
      energyObservations: [
        {
          activity: 'Transforming raw telemetry into concrete product solutions',
          direction: 'energizing',
          evidence: 'Digging into the raw data and turning it into a tangible design solution energized me',
          evidenceType: 'explicit',
          confidence: 0.97,
        },
      ],
      workStyleObservations: [
        {
          pattern: 'Proactive ownership beyond formal bug filing',
          evidence: 'Rather than just filing a bug ticket, I wrote a one-page synthesis',
          evidenceType: 'explicit',
          confidence: 0.93,
        },
      ],
      emotions: [
        { label: 'Curiosity & Energized', evidence: 'energized me', confidence: 0.95 },
      ],
      reflectionQuestion:
        'What other user journeys in your application might benefit from proactive SQL drop-off telemetry?',
      modelUsed: 'gemini-3.8-flash',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    'demo-entry-4': {
      id: 'analysis-4',
      userId: DEMO_USER_ID,
      journalEntryId: 'demo-entry-4',
      summary:
        'Mentored a junior engineer on asynchronous error boundaries using conceptual diagrams and sandbox practice.',
      tasks: [
        {
          description: 'Pair programmed and explained React error boundary architecture',
          category: 'Mentorship',
          evidence: 'paired for an hour with a junior frontend engineer... built an interactive sandbox example',
        },
      ],
      skills: [
        {
          name: 'Technical Mentorship',
          category: 'Interpersonal',
          evidence: 'built an interactive sandbox example together... love teaching and translating complex ideas',
          evidenceType: 'explicit',
          confidence: 0.96,
          strength: 'strong',
        },
        {
          name: 'Pedagogical Translation',
          category: 'Communication',
          evidence: 'drew out how errors propagate up the component tree',
          evidenceType: 'explicit',
          confidence: 0.91,
          strength: 'strong',
        },
        {
          name: 'Frontend Systems Architecture',
          category: 'Technical',
          evidence: 'asynchronous error boundaries in React',
          evidenceType: 'explicit',
          confidence: 0.87,
          strength: 'moderate',
        },
      ],
      energyObservations: [
        {
          activity: 'Mentoring peers and witnessing conceptual breakthroughs',
          direction: 'energizing',
          evidence: 'Seeing their eyes light up when the concept clicked reminded me how much I love teaching',
          evidenceType: 'explicit',
          confidence: 0.98,
        },
      ],
      workStyleObservations: [
        {
          pattern: 'Empowerment over quick fixes',
          evidence: 'Instead of just fixing it for them, we drew out how errors propagate',
          evidenceType: 'explicit',
          confidence: 0.94,
        },
      ],
      emotions: [
        { label: 'Fulfillment & Joy', evidence: 'reminded me how much I love teaching', confidence: 0.96 },
      ],
      reflectionQuestion:
        'Could creating reusable internal engineering guides capture this teaching leverage at scale?',
      modelUsed: 'gemini-3.8-flash',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    'demo-entry-5': {
      id: 'analysis-5',
      userId: DEMO_USER_ID,
      journalEntryId: 'demo-entry-5',
      summary:
        'Constructed and shipped a complete vertical prototype with resilient edge case handling and instant feedback loops.',
      tasks: [
        {
          description: 'Built interactive milestone verification panel prototype',
          category: 'Software Engineering',
          evidence: 'built a complete working prototype of the milestone verification panel',
        },
      ],
      skills: [
        {
          name: 'Interactive Prototyping',
          category: 'Technical',
          evidence: 'built a complete working prototype... responsive touch states and real data bindings',
          evidenceType: 'explicit',
          confidence: 0.95,
          strength: 'strong',
        },
        {
          name: 'Edge-Case Resilience',
          category: 'Analytical',
          evidence: 'tested edge cases like empty states and server timeouts',
          evidenceType: 'explicit',
          confidence: 0.9,
          strength: 'strong',
        },
        {
          name: 'Rapid Vertical Execution',
          category: 'Execution',
          evidence: 'Shipping a real, usable vertical slice in a single focused day',
          evidenceType: 'explicit',
          confidence: 0.92,
          strength: 'strong',
        },
      ],
      energyObservations: [
        {
          activity: 'Delivering end-to-end usable software slice in focused flow',
          direction: 'energizing',
          evidence: 'Shipping a real, usable vertical slice in a single focused day felt fantastic',
          evidenceType: 'explicit',
          confidence: 0.98,
        },
      ],
      workStyleObservations: [
        {
          pattern: 'Autonomous end-to-end execution with high finish discipline',
          evidence: 'tested edge cases like empty states and server timeouts... single focused day',
          evidenceType: 'inferred',
          confidence: 0.9,
        },
      ],
      emotions: [
        { label: 'Pride & Momentum', evidence: 'felt fantastic', confidence: 0.94 },
      ],
      reflectionQuestion:
        'What was the key constraint that allowed you to complete the entire slice within a single day?',
      modelUsed: 'gemini-3.8-flash',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  };

  for (const [id, analysis] of Object.entries(analyses)) {
    db.analyses[id] = analysis;
  }

  // Career Hypotheses synthesized from the 5 entries
  const careerHypotheses: CareerHypothesis[] = [
    {
      id: 'career-1',
      userId: DEMO_USER_ID,
      title: 'Product Engineer (Technical Product Builder)',
      description:
        'A full-lifecycle builder who bridges user pain points, data telemetry, and high-craft UI implementation to deliver tangible software features.',
      whyItMayFit:
        'Observed evidence demonstrates strong alignment: you enjoy diving into user telemetry (Oct 9) and sketching customer journeys (Oct 7), combined with high satisfaction from shipping complete vertical prototypes (Oct 13).',
      relevantStrengths: [
        'Data-Informed UX Analysis',
        'Interactive Prototyping',
        'Root Cause Analysis',
        'Cross-Functional Translation',
      ],
      supportingEvidence: [
        {
          entryId: 'demo-entry-3',
          excerpt: 'Digging into the raw data and turning it into a tangible design solution energized me',
          skillName: 'Data-Informed UX Analysis',
        },
        {
          entryId: 'demo-entry-5',
          excerpt: 'Shipping a real, usable vertical slice in a single focused day felt fantastic',
          skillName: 'Interactive Prototyping',
        },
        {
          entryId: 'demo-entry-2',
          excerpt: 'sketched a clear visual user flow linking customer pain points to technical trade-offs',
          skillName: 'User Journey Mapping',
        },
      ],
      potentialEnvironments: [
        'Fast-paced product teams with high autonomy',
        'Early-stage to growth venture studios',
        'User-centric SaaS organizations',
      ],
      typicalTasks: [
        'Rapid prototyping and user validation',
        'Instrumenting product telemetry and analyzing funnel anomalies',
        'Architecting robust frontend interactions and state machines',
      ],
      skillsToDevelop: [
        'Quantitative A/B testing methodologies',
        'Systematic user interview techniques',
      ],
      challenges: [
        'May encounter frustration in bureaucratic environments with high meeting loads',
      ],
      unknowns: [
        'How comfortably you manage multi-month roadmaps compared to 1-week execution sprints',
      ],
      smallExperiment:
        'Spend 4 hours next week conducting a mini product audit: pick one friction point in a product you use daily, diagram the flow, write a 1-page spec, and build a rough prototype.',
      suggestedNextSteps: [
        'Review the Product Engineering Roadmap',
        'Formulate your personal criteria for a high-autonomy team',
      ],
      evidenceStrength: 'supported_by_repeated_observations',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'career-2',
      userId: DEMO_USER_ID,
      title: 'Developer Experience (DevRel / Technical Educator)',
      description:
        'An empathetic technical communicator who creates sandboxes, guides, and tools to help engineers understand and adopt complex architectures.',
      whyItMayFit:
        'Your explicit enthusiasm for mentoring (Oct 11) and turning confusing concepts into visual models (Oct 7) shows natural aptitude for developer education.',
      relevantStrengths: [
        'Technical Mentorship',
        'Pedagogical Translation',
        'Technical Writing',
        'Systems Diagnostics',
      ],
      supportingEvidence: [
        {
          entryId: 'demo-entry-4',
          excerpt: 'Seeing their eyes light up when the concept clicked reminded me how much I love teaching',
          skillName: 'Technical Mentorship',
        },
        {
          entryId: 'demo-entry-2',
          excerpt: 'Once everyone could see the journey visually, the tension dissolved',
          skillName: 'Cross-Functional Translation',
        },
      ],
      potentialEnvironments: [
        'Developer tool companies (databases, cloud platforms, UI frameworks)',
        'Open-source foundation leadership',
        'Technical training organizations',
      ],
      typicalTasks: [
        'Authoring interactive documentation and architectural guides',
        'Building demonstration repositories and starter templates',
        'Hosting technical workshops and office hours',
      ],
      skillsToDevelop: [
        'Public speaking at developer conferences',
        'Community engagement and forum facilitation',
      ],
      challenges: [
        'Requires frequent context switching across multiple developer queries',
      ],
      unknowns: [
        'Preference between 1-on-1 mentorship vs. producing video/written content at scale',
      ],
      smallExperiment:
        'Write a public 600-word explanation of React error boundaries with a CodeSandbox demo link and gather feedback from 3 peers.',
      suggestedNextSteps: [
        'Explore DevRel roadmaps and documentation architectures',
      ],
      evidenceStrength: 'promising_match',
      status: 'saved',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'career-3',
      userId: DEMO_USER_ID,
      title: 'UX Systems Researcher & Analyst',
      description:
        'A forensic observer who uncovers cognitive friction in digital systems through mixed-methods telemetry and visual workflow mapping.',
      whyItMayFit:
        'Strong demonstration of synthesizing quantitative anomalies into actionable clarity (Oct 9) and resolving ambiguity through visual models (Oct 7).',
      relevantStrengths: [
        'Data-Informed UX Analysis',
        'Root Cause Analysis',
        'User Journey Mapping',
        'SQL Exploration',
      ],
      supportingEvidence: [
        {
          entryId: 'demo-entry-3',
          excerpt: 'wrote a one-page synthesis explaining the UX hurdle and suggested a cleaner fallback flow',
          skillName: 'Data-Informed UX Analysis',
        },
      ],
      potentialEnvironments: [
        'Enterprise productivity software',
        'Fintech or healthcare applications requiring zero error tolerance',
        'Design research agencies',
      ],
      typicalTasks: [
        'Analyzing user funnel telemetry and drop-offs',
        'Running usability benchmarks and cognitive walkthroughs',
        'Formulating evidence-based design recommendations',
      ],
      skillsToDevelop: [
        'Formal statistical analysis for usability metrics',
        'Qualitative interview facilitation protocols',
      ],
      challenges: [
        'May miss the thrill of directly writing and shipping production code',
      ],
      unknowns: [
        'Whether you prefer diagnosing problems or directly implementing their solutions',
      ],
      smallExperiment:
        'Shadow a user through a 15-minute onboarding flow, record cognitive hurdles, and create a 2-page friction report.',
      suggestedNextSteps: [
        'Read Nielsen Norman group research on cognitive walkthroughs',
      ],
      evidenceStrength: 'early_hypothesis',
      status: 'saved',
      createdAt: new Date().toISOString(),
    },
  ];

  db.careers[DEMO_USER_ID] = careerHypotheses;

  // Active Roadmap for Career 1: Product Engineer
  const roadmap: Roadmap = {
    id: 'demo-roadmap-1',
    userId: DEMO_USER_ID,
    careerRecommendationId: 'career-1',
    careerTitle: 'Product Engineer (Technical Product Builder)',
    weeklyTimeBudget: 6,
    overallStatus: 'active',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1: Foundations of Product Thinking',
        description:
          'Deepen ability to quantify user problems with data and structure fast hypotheses before writing code.',
        milestones: [
          {
            id: 'm-1-1',
            roadmapId: 'demo-roadmap-1',
            phaseId: 'phase-1',
            title: 'Define Problem Statements from Raw Telemetry',
            description:
              'Analyze real application drop-off logs and extract 3 actionable user friction hypotheses with supporting metrics.',
            completionCriteria:
              'A written 1-page synthesis linking data drop-off points to concrete user UX hypotheses.',
            skillsTargeted: ['Data-Informed UX Analysis', 'SQL Exploration', 'Technical Writing'],
            suggestedActivities: [
              'Extract funnel metrics from a sample database',
              'Draft an executive summary isolating the primary UX hurdle',
            ],
            estimatedDuration: '1 week (4-6 hours)',
            status: 'completed',
            completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
          {
            id: 'm-1-2',
            roadmapId: 'demo-roadmap-1',
            phaseId: 'phase-1',
            title: 'Master User Journey & Visual Flow Mapping',
            description:
              'Map a multi-step user interaction highlighting both system state changes and cognitive stress points.',
            completionCriteria:
              'A complete visual journey diagram demonstrating error boundaries and alternative user paths.',
            skillsTargeted: ['User Journey Mapping', 'Cross-Functional Translation'],
            suggestedActivities: [
              'Sketch whiteboard flow diagram',
              'Review with a teammate for cognitive clarity',
            ],
            estimatedDuration: '1 week (5 hours)',
            status: 'completed',
            completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'phase-2',
        name: 'Phase 2: Guided Prototyping & Feedback Loops',
        description:
          'Build rapid, resilient frontend slices that test product assumptions with live users.',
        milestones: [
          {
            id: 'm-2-1',
            roadmapId: 'demo-roadmap-1',
            phaseId: 'phase-2',
            title: 'Build an Interactive Vertical Verification Slice',
            description:
              'Implement an interactive UI component with real data persistence, optimistic updates, and resilient edge cases.',
            completionCriteria:
              'A working prototype with error boundaries, empty states, and under-200ms interaction feedback.',
            skillsTargeted: ['Interactive Prototyping', 'Edge-Case Resilience', 'Rapid Vertical Execution'],
            suggestedActivities: [
              'Create responsive component with state transitions',
              'Test network lag and error recovery',
            ],
            estimatedDuration: '2 weeks (10 hours)',
            status: 'needs_review', // AI detected progress from Entry 5!
          },
          {
            id: 'm-2-2',
            roadmapId: 'demo-roadmap-1',
            phaseId: 'phase-2',
            title: 'Conduct Usability Validation on Prototype',
            description:
              'Run 2 real usability sessions observing participants interacting with your prototype without guiding them.',
            completionCriteria:
              'Notes from 2 sessions highlighting unexpected friction points and validated assumptions.',
            skillsTargeted: ['User Feedback Synthesis', 'Observational Analysis'],
            suggestedActivities: [
              'Record 15-minute user session',
              'Document top 3 behavioral surprises',
            ],
            estimatedDuration: '2 weeks (6 hours)',
            status: 'not_started',
          },
        ],
      },
      {
        id: 'phase-3',
        name: 'Phase 3: Applied Projects & Full-Stack Craft',
        description:
          'Deliver an end-to-end product feature with instrumentation and demonstrable business impact.',
        milestones: [
          {
            id: 'm-3-1',
            roadmapId: 'demo-roadmap-1',
            phaseId: 'phase-3',
            title: 'Full-Stack Feature with Analytics Instrumentation',
            description:
              'Design, build, and deploy a customer-facing feature equipped with event telemetry to measure adoption.',
            completionCriteria:
              'Deployed feature with live event tracking and a monitoring dashboard.',
            skillsTargeted: ['Full-Stack Engineering', 'Product Analytics', 'Systems Architecture'],
            suggestedActivities: [
              'Set up server endpoints and database tables',
              'Track key funnel milestones in code',
            ],
            estimatedDuration: '3 weeks (15 hours)',
            status: 'not_started',
          },
        ],
      },
    ],
  };

  db.roadmaps[DEMO_USER_ID] = roadmap;

  // Progress Events
  const progressEvents: ProgressEvent[] = [
    {
      id: 'event-1',
      userId: DEMO_USER_ID,
      roadmapId: 'demo-roadmap-1',
      milestoneId: 'm-2-1',
      milestoneTitle: 'Build an Interactive Vertical Verification Slice',
      journalEntryId: 'demo-entry-5',
      journalEntryDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      evidenceExcerpt:
        'Today I built a complete working prototype of the milestone verification panel with responsive touch states and real data bindings... tested edge cases like empty states and server timeouts.',
      classification: 'strong_progress',
      confidence: 0.94,
      proposedAction: 'complete_milestone',
      userConfirmationStatus: 'pending', // Awaiting user confirmation!
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'event-2',
      userId: DEMO_USER_ID,
      roadmapId: 'demo-roadmap-1',
      milestoneId: 'm-1-1',
      milestoneTitle: 'Define Problem Statements from Raw Telemetry',
      journalEntryId: 'demo-entry-3',
      journalEntryDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      evidenceExcerpt:
        'wrote a one-page synthesis explaining the UX hurdle and suggested a cleaner fallback flow. Digging into the raw data and turning it into a tangible design solution energized me.',
      classification: 'milestone_complete',
      confidence: 0.96,
      proposedAction: 'complete_milestone',
      userConfirmationStatus: 'confirmed',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  db.progressEvents[DEMO_USER_ID] = progressEvents;

  // Weekly Reflection Report
  const weeklyReport: WeeklyReflectionReport = {
    id: 'report-demo-1',
    userId: DEMO_USER_ID,
    weekStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    weekEnd: new Date().toISOString().split('T')[0],
    summary:
      'This week revealed a clear pattern: you thrive when combining analytical problem-solving with tangible visual outcomes. Mentoring a teammate and building an interactive vertical prototype were your highest energy peaks.',
    skillsDemonstrated: [
      'Root Cause Analysis',
      'User Journey Mapping',
      'Technical Mentorship',
      'Interactive Prototyping',
      'Data-Informed UX Analysis',
    ],
    positiveMoments: [
      'Resolving the elusive race condition after deep tracing',
      'The moment of breakthrough when mentoring on error boundaries',
      'Shipping a polished, working prototype in a single focused day',
    ],
    challenges: [
      'Unstructured cross-functional meetings without visual artifacts felt draining',
    ],
    recurringPatterns: [
      'Visual models consistently transform ambiguity and tension into consensus',
      'Deep focus on causal puzzles energizes, while circular debates deplete momentum',
    ],
    roadmapProgress:
      'Completed 2 foundational milestones in the Product Engineer track. Milestone 2.1 (Interactive Vertical Slice) has strong observed evidence awaiting confirmation.',
    weeklyQuestion:
      'How could you structure next week to guard at least two 3-hour deep focus blocks for prototype exploration?',
    createdAt: new Date().toISOString(),
  };

  db.weeklyReports[DEMO_USER_ID] = [weeklyReport];

  writeDb(db);
  return demoUser;
}
