import http from 'http';
import { app } from '../server.ts';
import { cleanAndParseJson } from '../server/ai.ts';
import {
  readDb,
  getRoadmap,
  saveRoadmap,
  saveProgressEvent,
  getProgressEvents,
} from '../server/db.ts';
import { Roadmap, ProgressEvent } from '../src/types/index.ts';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ category, name, passed: true });
    console.log(`  ✓ [${category}] ${name}`);
  } catch (err: any) {
    results.push({ category, name, passed: false, error: err.message });
    console.error(`  ✗ [${category}] ${name}: ${err.message}`);
  }
}

async function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve({ server, baseUrl });
    });
  });
}

async function runAllAuditTests() {
  console.log('================================================================');
  console.log(' COGNITIVE DIARY: PRODUCTION-READINESS AUDIT & VERIFICATION');
  console.log('================================================================\n');

  const { server, baseUrl } = await startTestServer();

  let userA: any = null;
  let tokenA = '';
  let userB: any = null;
  let tokenB = '';
  let createdEntryId = '';

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION & ACCESS CONTROL
    // -------------------------------------------------------------
    await runTest('Authentication', 'Registration generates user and session token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Test User Alpha',
          email: `alpha_${Date.now()}@example.com`,
        }),
      });
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      const data = await res.json();
      assert(Boolean(data.user && data.user.id), 'Expected user object with ID');
      assert(Boolean(data.token && data.token.startsWith('cdt_')), 'Expected session token starting with cdt_');
      userA = data.user;
      tokenA = data.token;
    });

    await runTest('Authentication', 'Register second user for cross-user isolation tests', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Test User Beta',
          email: `beta_${Date.now()}@example.com`,
        }),
      });
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      const data = await res.json();
      userB = data.user;
      tokenB = data.token;
      assert(userA.id !== userB.id, 'Users must have unique IDs');
    });

    await runTest('Authentication', 'Token Bearer authentication verifies session correctly', async () => {
      const resA = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(resA.status === 200, `Expected 200, got ${resA.status}`);
      const dataA = await resA.json();
      assert(dataA.user.id === userA.id, 'Token A must resolve to User A');

      const resB = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(resB.status === 200, `Expected 200, got ${resB.status}`);
      const dataB = await resB.json();
      assert(dataB.user.id === userB.id, 'Token B must resolve to User B');
    });

    await runTest('Authentication', 'Requests without token receive 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/journal`);
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await runTest('Authentication', 'Requests with invalid token receive 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/journal`, {
        headers: { Authorization: 'Bearer invalid_forged_token_xyz' },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await runTest('Access Control', 'Client-supplied x-user-id header NEVER grants access without token', async () => {
      const res = await fetch(`${baseUrl}/api/journal`, {
        headers: { 'x-user-id': userA.id },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await runTest('Access Control', 'Client-supplied x-user-id header does not override authenticated session', async () => {
      // User B provides Token B, but tries to spoof User A via x-user-id header
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'x-user-id': userA.id,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.user.id === userB.id, 'Authenticated identity MUST come from session token, not client spoof header');
    });

    await runTest('Authentication', 'Demo mode seeds demo account and issues session token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/demo`, { method: 'POST' });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.user.isDemo === true, 'Expected isDemo flag true');
      assert(Boolean(data.token), 'Expected demo session token');
    });

    // -------------------------------------------------------------
    // 2. JOURNAL CRUD & ISOLATION
    // -------------------------------------------------------------
    await runTest('Journal CRUD', 'User creates journal entry and it persists in database', async () => {
      const res = await fetch(`${baseUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          originalText: 'Led cross-functional architecture review and resolved database connection bottleneck for the search pipeline.',
          entryDate: '2026-10-14',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const data = await res.json();
      assert(Boolean(data.entry && data.entry.id), 'Expected entry with ID');
      assert(data.entry.userId === userA.id, 'Entry userId must match User A');
      createdEntryId = data.entry.id;

      // Verify direct database persistence on disk
      const db = readDb();
      assert(Boolean(db.entries[createdEntryId]), 'Entry must persist to database schema on disk');
      assert(db.entries[createdEntryId].userId === userA.id, 'Persisted entry must belong to User A');
    });

    await runTest('Journal CRUD', 'User can retrieve own journal entry by ID', async () => {
      const res = await fetch(`${baseUrl}/api/journal/${createdEntryId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.entry.id === createdEntryId, 'Retrieved entry ID must match');
    });

    await runTest('Access Control', 'User B CANNOT read User A journal entry (cross-user isolation)', async () => {
      const res = await fetch(`${baseUrl}/api/journal/${createdEntryId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(res.status === 404, `Expected 404 Not Found for cross-user entry access, got ${res.status}`);
    });

    await runTest('Journal CRUD', 'User updates own journal entry text and word count', async () => {
      const res = await fetch(`${baseUrl}/api/journal/${createdEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          originalText: 'Led cross-functional architecture review and resolved database bottleneck. Mentored two junior engineers on latency profiling.',
          entryDate: '2026-10-14',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.entry.wordCount > 10, 'Expected word count updated');
      assert(data.entry.originalText.includes('Mentored'), 'Expected text updated');
    });

    await runTest('Access Control', 'User B CANNOT update or delete User A journal entry', async () => {
      const updateRes = await fetch(`${baseUrl}/api/journal/${createdEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ originalText: 'Malicious modification attempt' }),
      });
      assert(updateRes.status === 404, `Expected 404 on update from unauthorized user, got ${updateRes.status}`);

      const deleteRes = await fetch(`${baseUrl}/api/journal/${createdEntryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(deleteRes.status === 404, `Expected 404 on delete from unauthorized user, got ${deleteRes.status}`);
    });

    // -------------------------------------------------------------
    // 3. DUPLICATE PROCESSING
    // -------------------------------------------------------------
    await runTest('Duplicate Processing', 'Rapid identical journal submission is cleanly deduplicated', async () => {
      const text = 'Completed high-priority migration sprint meeting and synchronized delivery timeline.';
      const date = '2026-10-15';

      const res1 = await fetch(`${baseUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ originalText: text, entryDate: date }),
      });
      assert(res1.status === 201, `Expected 201 for first submission, got ${res1.status}`);
      const data1 = await res1.json();

      // Second immediate identical submission
      const res2 = await fetch(`${baseUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ originalText: text, entryDate: date }),
      });
      assert(res2.status === 200, `Expected 200 deduplicated response, got ${res2.status}`);
      const data2 = await res2.json();
      assert(data2.deduplicated === true, 'Expected deduplicated flag');
      assert(data2.entry.id === data1.entry.id, 'Deduplicated call must return existing entry ID');
    });

    // -------------------------------------------------------------
    // 4. MALFORMED AI OUTPUT & CLEAN JSON PARSER
    // -------------------------------------------------------------
    await runTest('AI Resilience', 'cleanAndParseJson extracts from markdown code blocks', async () => {
      const sample = '```json\n{\n  "status": "success",\n  "skills": ["Distributed Systems"]\n}\n```';
      const parsed = cleanAndParseJson<{ status: string; skills: string[] }>(sample, 'test markdown');
      assert(parsed.status === 'success', 'Parsed status must match');
      assert(parsed.skills[0] === 'Distributed Systems', 'Parsed skills must match');
    });

    await runTest('AI Resilience', 'cleanAndParseJson handles preamble commentary before JSON', async () => {
      const sample = 'Here is the detailed analysis you requested:\n\n{"summary": "Strong engineering leadership demonstrated"}';
      const parsed = cleanAndParseJson<{ summary: string }>(sample, 'test preamble');
      assert(parsed.summary.includes('leadership'), 'Parsed summary must extract cleanly');
    });

    await runTest('AI Resilience', 'cleanAndParseJson throws descriptive error on broken/malformed JSON', async () => {
      let threw = false;
      try {
        cleanAndParseJson('This is completely unparseable garbage with unclosed { "key": ', 'test malformed');
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('Invalid structured JSON'), 'Error message must clearly describe parsing failure');
      }
      assert(threw, 'Malformed JSON must throw without corrupting application state');
    });

    // -------------------------------------------------------------
    // 5. ANALYSIS RETRIES
    // -------------------------------------------------------------
    await runTest('Analysis Retries', 'Retry route /api/journal/:id/analyze without key rejects gracefully', async () => {
      // Create fresh entry
      const createRes = await fetch(`${baseUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          originalText: 'Refactored backend memory pooling and profiled memory allocations.',
          entryDate: '2026-10-15',
        }),
      });
      const createData = await createRes.json();
      const entryId = createData.entry.id;

      // Call retry endpoint
      const retryRes = await fetch(`${baseUrl}/api/journal/${entryId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      // If GEMINI_API_KEY is not configured, it returns 400; if configured, it returns 200
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
        assert(retryRes.status === 200, `Expected 200 with configured key, got ${retryRes.status}`);
      } else {
        assert(retryRes.status === 400, `Expected 400 with missing key, got ${retryRes.status}`);
        const errData = await retryRes.json();
        assert(errData.error.includes('Gemini API key'), 'Error must inform user about missing GEMINI_API_KEY');
      }
    });

    // -------------------------------------------------------------
    // 6. MILESTONE CONFIRMATION & STATUS REVERSAL
    // -------------------------------------------------------------
    await runTest('Milestone Progress', 'Milestone event confirmation advances status to completed', async () => {
      // Set up a test roadmap for User A
      const testRoadmap: Roadmap = {
        id: `rm-${Date.now()}`,
        userId: userA.id,
        careerRecommendationId: 'lead-architect',
        careerTitle: 'Staff Infrastructure Architect',
        weeklyTimeBudget: 6,
        overallStatus: 'active',
        phases: [
          {
            id: 'phase-1',
            name: 'Foundation & Latency Profiling',
            description: 'Core performance foundation',
            milestones: [
              {
                id: 'ms-perf-audit',
                roadmapId: 'rm-test',
                phaseId: 'phase-1',
                title: 'Conduct end-to-end distributed system latency audit',
                description: 'Profile P99 query latency',
                completionCriteria: 'Identify top 3 bottlenecks',
                skillsTargeted: ['Performance Engineering'],
                suggestedActivities: ['Run trace analysis'],
                estimatedDuration: '2 weeks',
                status: 'in_progress',
              },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveRoadmap(testRoadmap);

      // Save a pending milestone progress event
      const testEvent: ProgressEvent = {
        id: `pe-test-${Date.now()}`,
        userId: userA.id,
        roadmapId: testRoadmap.id,
        milestoneId: 'ms-perf-audit',
        milestoneTitle: 'Conduct end-to-end distributed system latency audit',
        journalEntryId: createdEntryId,
        journalEntryDate: '2026-10-14',
        evidenceExcerpt: 'Identified top 3 bottlenecks in query pipeline and profiled P99 latency',
        classification: 'milestone_complete',
        confidence: 0.95,
        proposedAction: 'complete_milestone',
        userConfirmationStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      saveProgressEvent(testEvent);

      // Confirm event via API
      const confirmRes = await fetch(`${baseUrl}/api/progress-events/${testEvent.id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(confirmRes.status === 200, `Expected 200, got ${confirmRes.status}`);
      const confirmData = await confirmRes.json();
      assert(confirmData.event.userConfirmationStatus === 'confirmed', 'Event status must be confirmed');

      // Verify roadmap milestone is now marked completed
      const updatedRoadmap = getRoadmap(userA.id);
      const milestone = updatedRoadmap?.phases[0].milestones.find((m) => m.id === 'ms-perf-audit');
      assert(milestone?.status === 'completed', 'Milestone must be completed upon confirmation');
    });

    await runTest('Milestone Progress', 'Milestone rejection reverses needs_review status back to in_progress', async () => {
      const testRoadmap = getRoadmap(userA.id)!;
      testRoadmap.phases[0].milestones.push({
        id: 'ms-resilience-audit',
        roadmapId: testRoadmap.id,
        phaseId: 'phase-1',
        title: 'Conduct network resilience test',
        description: 'Test chaos failure modes',
        completionCriteria: 'Verify circuit breakers',
        skillsTargeted: ['Chaos Engineering'],
        suggestedActivities: ['Simulate network latency'],
        estimatedDuration: '1 week',
        status: 'needs_review',
      });
      saveRoadmap(testRoadmap);

      const reviewEvent: ProgressEvent = {
        id: `pe-review-${Date.now()}`,
        userId: userA.id,
        roadmapId: testRoadmap.id,
        milestoneId: 'ms-resilience-audit',
        milestoneTitle: 'Conduct network resilience test',
        journalEntryId: `entry-reject-${Date.now()}`,
        journalEntryDate: '2026-10-15',
        evidenceExcerpt: 'Partial resilience progress observed',
        classification: 'possible_progress',
        confidence: 0.65,
        proposedAction: 'complete_milestone',
        userConfirmationStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      saveProgressEvent(reviewEvent);

      const rejectRes = await fetch(`${baseUrl}/api/progress-events/${reviewEvent.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(rejectRes.status === 200, `Expected 200, got ${rejectRes.status}`);
      const rejectData = await rejectRes.json();
      assert(rejectData.event.userConfirmationStatus === 'rejected', 'Event status must be rejected');

      // Verify roadmap milestone was safely reverted from needs_review back to in_progress
      const updatedRoadmap = getRoadmap(userA.id);
      const milestone = updatedRoadmap?.phases[0].milestones.find((m) => m.id === 'ms-resilience-audit');
      assert(milestone?.status === 'in_progress', 'Rejected review event must restore status to in_progress');
    });

    // -------------------------------------------------------------
    // 7. DATA EXPORT & ACCOUNT DELETION
    // -------------------------------------------------------------
    await runTest('Data Export', 'Export returns comprehensive user archive with zero cross-user leakage', async () => {
      const res = await fetch(`${baseUrl}/api/user/export`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const archive = await res.json();
      assert(archive.user.id === userA.id, 'Exported user must match User A');
      assert(Array.isArray(archive.entries), 'Export must contain entries array');
      assert(archive.entries.every((e: any) => e.userId === userA.id), 'All entries must belong exclusively to User A');
      assert(archive.roadmap && archive.roadmap.userId === userA.id, 'Roadmap must belong exclusively to User A');
    });

    await runTest('Account Deletion', 'Account deletion permanently wipes user and all associated records', async () => {
      const res = await fetch(`${baseUrl}/api/user/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify token A is now invalid
      const checkRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(checkRes.status === 401, `Expected 401 after deletion, got ${checkRes.status}`);

      // Verify disk storage has wiped user A data
      const db = readDb();
      assert(!db.users[userA.id], 'User record must be wiped from database');
      const userAEntries = Object.values(db.entries).filter((e) => e.userId === userA.id);
      assert(userAEntries.length === 0, 'All user journal entries must be wiped');
      assert(!db.roadmaps[userA.id], 'User roadmap must be wiped');
    });

    // -------------------------------------------------------------
    // 8. LOGOUT
    // -------------------------------------------------------------
    await runTest('Authentication', 'Logout revokes active session token', async () => {
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(logoutRes.status === 200, `Expected 200, got ${logoutRes.status}`);

      const afterRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(afterRes.status === 401, `Expected 401 after logout, got ${afterRes.status}`);
    });

  } finally {
    server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log(' AUDIT TEST RESULTS SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total tests executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.error(`- [${r.category}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL 18 AUDIT TESTS PASSED SUCCESSFULLY! ✓\n');
  }
}

runAllAuditTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
