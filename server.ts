import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import {
  getUser,
  getUserByEmail,
  saveUser,
  getJournalEntries,
  getJournalEntry,
  saveJournalEntry,
  deleteJournalEntry,
  saveJournalAnalysis,
  markAnalysisStatus,
  getAggregatedSkills,
  saveSkillFeedback,
  getCareerHypotheses,
  saveCareerHypotheses,
  updateCareerStatus,
  getRoadmap,
  saveRoadmap,
  updateMilestoneStatus,
  getProgressEvents,
  saveProgressEvent,
  updateProgressEventStatus,
  getWeeklyReports,
  saveWeeklyReport,
  exportUserData,
  deleteUserAccount,
  seedDemoData,
  createSession,
  getSessionUser,
  deleteSession,
  DEMO_USER_ID,
} from './server/db.ts';
import {
  analyzeJournalEntry,
  detectMilestoneProgress,
  synthesizeCareerHypotheses,
  generateRoadmap,
  generateWeeklyReport,
  isGeminiConfigured,
} from './server/ai.ts';
import { User, JournalEntry, ProgressEvent } from './src/types/index.ts';

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure demo data exists on server boot
seedDemoData();

// Token-Based Authentication Middleware
// Enforce per-user access control: client-supplied user IDs (e.g. x-user-id or req.body.userId) NEVER grant access.
// Only validated cryptographic session tokens grant authenticated access.
function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const sessionHeader = req.headers['x-session-token'] as string;
  if (sessionHeader && sessionHeader.trim().length > 0) {
    return sessionHeader.trim();
  }
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. No valid session token provided.' });
    return;
  }
  const user = getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: 'User session invalid or expired. Please sign in again.' });
    return;
  }
  (req as any).user = user;
  (req as any).sessionToken = token;
  next();
}

// ---------------- API ROUTES ----------------

// System Status
app.get('/api/system/status', (_req: Request, res: Response) => {
  res.json({
    geminiConfigured: isGeminiConfigured(),
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// Auth Routes
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { displayName, email } = req.body;
  if (!email || !displayName) {
    res.status(400).json({ error: 'Email and display name are required' });
    return;
  }
  const existing = getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    onboardingCompleted: false,
    preferences: {
      remindersEnabled: true,
      shareDataForAnalysis: true,
      weeklyHoursBudget: 5,
    },
  };

  saveUser(newUser);
  const token = createSession(newUser.id);
  res.status(201).json({ user: newUser, token });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const user = getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No account found with this email. You can register or try Demo Mode.' });
    return;
  }
  const token = createSession(user.id);
  res.json({ user, token });
});

app.post('/api/auth/demo', (_req: Request, res: Response) => {
  const demoUser = seedDemoData();
  const token = createSession(demoUser.id);
  res.json({ user: demoUser, token });
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  res.json({ user });
});

app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).sessionToken;
  if (token) {
    deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.patch('/api/auth/preferences', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { preferences, onboardingCompleted, displayName } = req.body;

  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }
  if (typeof onboardingCompleted === 'boolean') {
    user.onboardingCompleted = onboardingCompleted;
  }
  if (displayName) {
    user.displayName = displayName.trim();
  }

  saveUser(user);
  res.json({ user });
});

// Journal Routes
app.get('/api/journal', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const entries = getJournalEntries(user.id);
  res.json({ entries });
});

app.get('/api/journal/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const entry = getJournalEntry(user.id, req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Journal entry not found' });
    return;
  }
  res.json({ entry });
});

async function checkMilestoneProgressForEntry(userId: string, entryId: string, entryText: string, entryDate: string) {
  try {
    const roadmap = getRoadmap(userId);
    if (!roadmap) return;
    const activeMilestones = roadmap.phases
      .flatMap((p) => p.milestones)
      .filter((m) => m.status === 'not_started' || m.status === 'in_progress' || m.status === 'needs_review');

    if (activeMilestones.length === 0) return;

    const detected = await detectMilestoneProgress(entryText, entryDate, activeMilestones);
    for (const det of detected) {
      if (det.classification === 'no_progress' || det.proposedAction === 'none') continue;

      const milestone = activeMilestones.find((m) => m.id === det.milestoneId);
      // Ambiguous evidence, partial progress, low confidence, or any milestone completion
      // MUST trigger a confirmation request rather than automatic completion.
      const isAmbiguous = det.isAmbiguous || det.classification === 'possible_progress' || det.confidence < 0.90;
      const isCompletion = det.proposedAction === 'complete_milestone' || det.classification === 'milestone_complete';
      const requiresUserConfirmation = isAmbiguous || isCompletion || det.proposedAction === 'request_review';
      const confirmationStatus = requiresUserConfirmation ? 'pending' : 'confirmed';

      const progressEvent: ProgressEvent = {
        id: `pe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        roadmapId: roadmap.id,
        milestoneId: det.milestoneId,
        milestoneTitle: milestone?.title || 'Active Milestone',
        journalEntryId: entryId,
        journalEntryDate: entryDate,
        evidenceExcerpt: det.evidenceExcerpt,
        classification: det.classification,
        confidence: det.confidence,
        proposedAction: det.proposedAction,
        userConfirmationStatus: confirmationStatus,
        createdAt: new Date().toISOString(),
      };
      saveProgressEvent(progressEvent);

      if (requiresUserConfirmation) {
        // Milestone completion or ambiguous evidence MUST trigger confirmation request rather than automatic completion
        if (isCompletion || milestone?.status === 'in_progress') {
          updateMilestoneStatus(userId, roadmap.id, det.milestoneId, 'needs_review');
        }
      } else if (milestone && milestone.status === 'not_started') {
        // Only unambiguous in-progress progress updates an unstarted milestone
        updateMilestoneStatus(userId, roadmap.id, milestone.id, 'in_progress');
      }
    }
  } catch (err) {
    console.error('Error checking milestone progress for entry:', err);
  }
}

app.post('/api/journal', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { originalText, entryDate } = req.body;

  if (!originalText || !originalText.trim()) {
    res.status(400).json({ error: 'Journal text cannot be empty' });
    return;
  }

  const dateStr = entryDate || new Date().toISOString().split('T')[0];
  const trimmedText = originalText.trim();
  const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;

  // Deduplicate rapid repeat submissions (e.g. accidental double-click or client retry within 60s)
  const userRecentEntries = getJournalEntries(user.id);
  const nowMs = Date.now();
  const duplicate = userRecentEntries.find(
    (e) =>
      e.entryDate === dateStr &&
      e.originalText === trimmedText &&
      Math.abs(nowMs - new Date(e.createdAt).getTime()) < 60000
  );
  if (duplicate) {
    res.status(200).json({ entry: duplicate, deduplicated: true });
    return;
  }

  const newEntry: JournalEntry = {
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    entryDate: dateStr,
    originalText: trimmedText,
    wordCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysisStatus: 'analyzing',
    isDemo: user.isDemo || false,
  };

  saveJournalEntry(newEntry);

  try {
    if (isGeminiConfigured()) {
      const analysis = await analyzeJournalEntry(user.id, newEntry.id, newEntry.originalText, newEntry.entryDate);
      saveJournalAnalysis(analysis);
      newEntry.analysisStatus = 'completed';
      newEntry.analysis = analysis;
      newEntry.analyzedAt = analysis.createdAt;

      await checkMilestoneProgressForEntry(user.id, newEntry.id, newEntry.originalText, newEntry.entryDate);
    } else {
      markAnalysisStatus(
        user.id,
        newEntry.id,
        'needs_retry',
        'Gemini API key is not configured. Add GEMINI_API_KEY in the Secrets panel.'
      );
      newEntry.analysisStatus = 'needs_retry';
      newEntry.analysisError = 'Gemini API key is not configured. Add GEMINI_API_KEY in the Secrets panel.';
    }
  } catch (err: any) {
    console.error('AI Journal analysis failed:', err);
    markAnalysisStatus(user.id, newEntry.id, 'needs_retry', err.message || 'AI analysis failed');
    newEntry.analysisStatus = 'needs_retry';
    newEntry.analysisError = err.message || 'AI analysis failed';
  }

  res.status(201).json({ entry: newEntry });
});

app.put('/api/journal/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const existing = getJournalEntry(user.id, req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Journal entry not found' });
    return;
  }

  const { originalText, entryDate } = req.body;
  if (!originalText || !originalText.trim()) {
    res.status(400).json({ error: 'Journal text cannot be empty' });
    return;
  }

  existing.originalText = originalText.trim();
  existing.wordCount = existing.originalText.split(/\s+/).filter(Boolean).length;
  if (entryDate) existing.entryDate = entryDate;
  existing.updatedAt = new Date().toISOString();
  existing.analysisStatus = 'analyzing';

  saveJournalEntry(existing);

  try {
    if (isGeminiConfigured()) {
      const analysis = await analyzeJournalEntry(user.id, existing.id, existing.originalText, existing.entryDate);
      saveJournalAnalysis(analysis);
      existing.analysisStatus = 'completed';
      existing.analysis = analysis;
      existing.analyzedAt = analysis.createdAt;

      await checkMilestoneProgressForEntry(user.id, existing.id, existing.originalText, existing.entryDate);
    } else {
      markAnalysisStatus(user.id, existing.id, 'needs_retry', 'Gemini API key is not configured');
      existing.analysisStatus = 'needs_retry';
    }
  } catch (err: any) {
    console.error('AI reanalysis failed:', err);
    markAnalysisStatus(user.id, existing.id, 'needs_retry', err.message);
    existing.analysisStatus = 'needs_retry';
    existing.analysisError = err.message;
  }

  res.json({ entry: existing });
});

app.delete('/api/journal/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const success = deleteJournalEntry(user.id, req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ success: true, deletedId: req.params.id });
});

app.post('/api/journal/:id/analyze', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const entry = getJournalEntry(user.id, req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  if (!isGeminiConfigured()) {
    res.status(400).json({ error: 'Gemini API key is not configured. Please add GEMINI_API_KEY.' });
    return;
  }

  markAnalysisStatus(user.id, entry.id, 'analyzing');

  try {
    const analysis = await analyzeJournalEntry(user.id, entry.id, entry.originalText, entry.entryDate);
    saveJournalAnalysis(analysis);
    entry.analysisStatus = 'completed';
    entry.analysis = analysis;

    await checkMilestoneProgressForEntry(user.id, entry.id, entry.originalText, entry.entryDate);

    res.json({ entry, analysis });
  } catch (err: any) {
    console.error('Retry analysis failed:', err);
    markAnalysisStatus(user.id, entry.id, 'needs_retry', err.message);
    res.status(500).json({ error: err.message || 'Analysis retry failed' });
  }
});

// Skills Routes
app.get('/api/skills', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const skills = getAggregatedSkills(user.id);
  res.json({ skills });
});

app.post('/api/skills/:skillId/feedback', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { feedback } = req.body;
  if (!feedback || !['accurate', 'partially_accurate', 'inaccurate'].includes(feedback)) {
    res.status(400).json({ error: 'Valid feedback type is required' });
    return;
  }
  saveSkillFeedback(user.id, req.params.skillId, feedback);
  res.json({ success: true, skillId: req.params.skillId, feedback });
});

// Career Discovery Routes
app.get('/api/careers', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const careers = getCareerHypotheses(user.id);
  res.json({ careers });
});

app.post('/api/careers/synthesize', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const skills = getAggregatedSkills(user.id);

  const distinctEntryDates = new Set(skills.flatMap((s) => s.evidenceExcerpts.map((e) => e.entryDate))).size;
  const distinctEntries = new Set(skills.flatMap((s) => s.evidenceExcerpts.map((e) => e.entryId))).size;
  if (skills.length < 2 || distinctEntryDates < 2 || distinctEntries < 2) {
    res.status(400).json({
      error: 'Insufficient longitudinal evidence. Please journal across at least 2 distinct days so Cognitive Diary can identify recurring patterns rather than one-off keywords.',
    });
    return;
  }

  const entries = getJournalEntries(user.id);
  const energyPatterns: Array<{ activity: string; direction: string; evidence: string }> = [];
  for (const e of entries) {
    if (e.analysis && e.analysis.energyObservations) {
      for (const en of e.analysis.energyObservations) {
        energyPatterns.push({
          activity: en.activity,
          direction: en.direction,
          evidence: en.evidence,
        });
      }
    }
  }

  try {
    const journalCatalog = entries.map((e) => ({
      id: e.id,
      entryDate: e.entryDate,
      summary: e.analysis?.summary || e.originalText.substring(0, 100),
    }));

    const hypotheses = await synthesizeCareerHypotheses(
      user.id,
      skills,
      energyPatterns,
      user.preferences.careerInterests || [],
      journalCatalog
    );
    saveCareerHypotheses(user.id, hypotheses);
    res.json({ careers: hypotheses });
  } catch (err: any) {
    console.error('Career synthesis failed:', err);
    res.status(500).json({ error: err.message || 'Career synthesis failed' });
  }
});

app.patch('/api/careers/:id/status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { status } = req.body;
  if (!status || !['active', 'saved', 'dismissed'].includes(status)) {
    res.status(400).json({ error: 'Valid status required' });
    return;
  }
  updateCareerStatus(user.id, req.params.id, status);
  res.json({ success: true, careerId: req.params.id, status });
});

// Roadmap Routes
app.get('/api/roadmaps/active', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const roadmap = getRoadmap(user.id);
  res.json({ roadmap });
});

app.post('/api/roadmaps/generate', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { careerTitle, careerRecommendationId, weeklyTimeBudget } = req.body;

  if (!careerTitle) {
    res.status(400).json({ error: 'Career title is required to generate roadmap' });
    return;
  }

  try {
    const skills = getAggregatedSkills(user.id).map((s) => s.name);
    const newRoadmap = await generateRoadmap(
      user.id,
      careerTitle,
      careerRecommendationId || 'custom',
      weeklyTimeBudget || user.preferences.weeklyHoursBudget || 6,
      skills,
      user.preferences.preferredLearningFormat || 'hands_on'
    );
    saveRoadmap(newRoadmap);
    res.status(201).json({ roadmap: newRoadmap });
  } catch (err: any) {
    console.error('Roadmap generation failed:', err);
    res.status(500).json({ error: err.message || 'Roadmap generation failed' });
  }
});

app.patch('/api/roadmaps/milestones/:milestoneId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { roadmapId, status } = req.body;
  if (!roadmapId || !status) {
    res.status(400).json({ error: 'roadmapId and status are required' });
    return;
  }
  const updated = updateMilestoneStatus(user.id, roadmapId, req.params.milestoneId, status);
  if (!updated) {
    res.status(404).json({ error: 'Milestone or roadmap not found' });
    return;
  }
  res.json({ roadmap: updated });
});

// Progress Events Routes
app.get('/api/progress-events', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const events = getProgressEvents(user.id);
  res.json({ events });
});

app.post('/api/progress-events/:id/confirm', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const event = updateProgressEventStatus(user.id, req.params.id, 'confirmed');
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ event, roadmap: getRoadmap(user.id) });
});

app.post('/api/progress-events/:id/reject', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const event = updateProgressEventStatus(user.id, req.params.id, 'rejected');
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ event });
});

// Weekly Insights & Reports
app.get('/api/insights/weekly', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const reports = getWeeklyReports(user.id);
  res.json({ reports });
});

app.post('/api/insights/weekly/generate', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const entries = getJournalEntries(user.id).slice(0, 7);

  if (entries.length === 0) {
    res.status(400).json({ error: 'Please write at least one journal entry to generate a weekly reflection report.' });
    return;
  }

  const weekEnd = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  try {
    const reportData = entries.map((e) => ({
      text: e.originalText,
      date: e.entryDate,
      summary: e.analysis?.summary,
    }));
    const report = await generateWeeklyReport(user.id, reportData, weekStart, weekEnd);
    saveWeeklyReport(report);
    res.status(201).json({ report });
  } catch (err: any) {
    console.error('Weekly report generation failed:', err);
    res.status(500).json({ error: err.message || 'Weekly report generation failed' });
  }
});

// Data Export & Deletion
app.get('/api/user/export', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const archive = exportUserData(user.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="cognitive-diary-${user.id}-${Date.now()}.json"`);
  res.send(JSON.stringify(archive, null, 2));
});

app.post('/api/user/delete', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  deleteUserAccount(user.id);
  res.json({ success: true, message: 'Account and all journal records have been permanently wiped.' });
});

// ---------------- VITE & STATIC HANDLING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognitive Diary server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { startServer };
