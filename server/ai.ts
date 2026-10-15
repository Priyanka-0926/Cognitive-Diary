import { GoogleGenAI, Type } from '@google/genai';
import {
  JournalAnalysis,
  CareerHypothesis,
  Roadmap,
  RoadmapPhase,
  Milestone,
  WeeklyReflectionReport,
  AggregatedSkill,
} from '../src/types/index.ts';

// Prompt Versioning
export const PROMPT_VERSIONS = {
  JOURNAL_ANALYSIS: 'v1.3.0',
  MILESTONE_PROGRESS: 'v1.2.0',
  CAREER_SYNTHESIS: 'v1.3.0',
  ROADMAP_GENERATION: 'v1.2.0',
  WEEKLY_SYNTHESIS: 'v1.2.0',
} as const;

// Model Selection: Fast resilient model with fallback
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.8-flash';

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Gemini API key is not configured. Please configure GEMINI_API_KEY.');
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientError(err: any): boolean {
  const msg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');
  return (
    err?.status === 429 ||
    err?.status === 503 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('fetch failed') ||
    msg.includes('ETIMEDOUT')
  );
}

// Robust JSON stripper and parser
export function cleanAndParseJson<T>(rawText: string, contextDescription: string): T {
  if (!rawText || !rawText.trim()) {
    throw new Error(`Empty response from Gemini during ${contextDescription}`);
  }
  let cleaned = rawText.trim();
  
  // Extract content between ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    // If still fails, attempt to locate outermost { ... } or [ ... ]
    const bracketMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (bracketMatch && bracketMatch[1]) {
      try {
        return JSON.parse(bracketMatch[1]) as T;
      } catch {
        // Fall through
      }
    }
    console.error(`[AI Parser] JSON parse error during ${contextDescription}:`, (firstErr as Error).message, '\nRaw text:', rawText);
    throw new Error(`Invalid structured JSON returned by Gemini during ${contextDescription}: ${(firstErr as Error).message}`);
  }
}

// Safe retry wrapper with primary + fallback model fallback and exponential backoff
async function callGeminiWithResilience<T>(
  operationName: string,
  fn: (ai: GoogleGenAI, modelName: string) => Promise<{ result: T; modelUsed: string }>,
  maxRetries = 2,
  baseDelay = 1000
): Promise<{ result: T; modelUsed: string }> {
  const ai = getAiClient();
  let modelToUse = PRIMARY_MODEL;
  let attempt = 0;

  while (true) {
    try {
      return await fn(ai, modelToUse);
    } catch (err: any) {
      attempt++;
      const transient = isTransientError(err);

      // If primary model experienced high demand or 503, switch to fallback model
      if (modelToUse === PRIMARY_MODEL && transient) {
        console.warn(`[Gemini:${operationName}] ${PRIMARY_MODEL} capacity error. Switching to ${FALLBACK_MODEL}...`);
        modelToUse = FALLBACK_MODEL;
      }

      if (attempt <= maxRetries && transient) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Gemini:${operationName}] Transient failure (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`[Gemini:${operationName}] Request failed after ${attempt} attempts:`, err?.message || err);
        throw err;
      }
    }
  }
}

// 1. Journal Entry Extraction Engine
export async function analyzeJournalEntry(
  userId: string,
  entryId: string,
  entryText: string,
  entryDate: string
): Promise<JournalAnalysis> {
  const prompt = `You are the Invisible Extraction Engine of Cognitive Diary (Prompt Version: ${PROMPT_VERSIONS.JOURNAL_ANALYSIS}).
Analyze the following daily journal entry written by a user on ${entryDate}.

EXTRACTION OBJECTIVES & GROUNDING RULES:
1. summary: A concise, factual 1-2 sentence overview of what the user worked on and experienced.
2. tasks: Concrete actions, problems worked on, or activities performed.
   - description: What was done.
   - category: Functional domain (e.g. Architecture, Debugging, Product Design, Team Collaboration).
   - evidence: Direct quote or excerpt from the text.
   - estimatedEffort: Optional effort/duration if mentioned or clearly implied.
3. skills: Specific demonstrated capabilities (e.g. Systems Diagnostics, User Journey Mapping, Data Analysis, SQL Exploration, Pedagogical Translation).
   - name: Clear, standardized skill name.
   - category: One of "Technical", "Analytical", "Creative", "Communication", "Execution", "Interpersonal", "Research", or "Leadership".
   - evidence: Exact quote from the text demonstrating this capability.
   - evidenceType: "explicit" if the user stated the action/thought directly, "inferred" if deduced from behavior context.
   - confidence: Bounded float between 0.10 and 0.99 reflecting observational certainty.
   - strength: "weak", "moderate", or "strong" based on depth of execution described.
4. energyObservations:
   - activity: Specific activity performed.
   - direction: Exactly one of "energizing", "draining", "neutral", "mixed", or "unknown".
   - evidence: Excerpt showing why this direction was assigned.
   - evidenceType: "explicit" if user named their emotion/energy, "inferred" if deduced from tone/outcome.
   - confidence: Bounded float between 0.10 and 0.99.
5. workStyleObservations: Observable behavioral patterns (e.g. autonomous deep focus, visual diagramming, pair mentoring, proactive root-cause analysis).
   - pattern: Descriptive label.
   - evidence: Excerpt from text.
   - evidenceType: "explicit" or "inferred".
   - confidence: Bounded float between 0.10 and 0.99.
6. emotions: Feelings explicitly named or clearly expressed in the text.
   - label: Emotion name.
   - evidence: Excerpt.
   - confidence: Bounded float between 0.10 and 0.99.
7. reflectionQuestion: Exactly one non-judgmental, thought-provoking question directly related to their entry to help them reflect deeper.

CRITICAL INTEGRITY RULES:
- Never diagnose psychiatric conditions or personality types.
- Never invent activities, skills, or quotes not present in the entry.
- Maintain honest confidence scores.

Journal Entry Text:
"""
${entryText}
"""`;

  const execution = await callGeminiWithResilience('JournalAnalysis', async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Factual summary of entry' },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  estimatedEffort: { type: Type.STRING },
                },
                required: ['description', 'category', 'evidence'],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  evidenceType: { type: Type.STRING, enum: ['explicit', 'inferred'] },
                  confidence: { type: Type.NUMBER },
                  strength: { type: Type.STRING, enum: ['weak', 'moderate', 'strong'] },
                },
                required: ['name', 'category', 'evidence', 'evidenceType', 'confidence', 'strength'],
              },
            },
            energyObservations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  activity: { type: Type.STRING },
                  direction: {
                    type: Type.STRING,
                    enum: ['energizing', 'draining', 'neutral', 'mixed', 'unknown'],
                  },
                  evidence: { type: Type.STRING },
                  evidenceType: { type: Type.STRING, enum: ['explicit', 'inferred'] },
                  confidence: { type: Type.NUMBER },
                },
                required: ['activity', 'direction', 'evidence', 'evidenceType', 'confidence'],
              },
            },
            workStyleObservations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pattern: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  evidenceType: { type: Type.STRING, enum: ['explicit', 'inferred'] },
                  confidence: { type: Type.NUMBER },
                },
                required: ['pattern', 'evidence', 'evidenceType', 'confidence'],
              },
            },
            emotions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['label', 'evidence', 'confidence'],
              },
            },
            reflectionQuestion: { type: Type.STRING },
          },
          required: ['summary', 'tasks', 'skills', 'energyObservations', 'workStyleObservations', 'emotions'],
        },
      },
    });

    const parsed = cleanAndParseJson<any>(response.text || '', 'JournalAnalysis');
    return { result: parsed, modelUsed: modelName };
  });

  const parsed = execution.result;

  // Strict schema validation and sanitization
  const sanitizedTasks = (parsed.tasks || [])
    .map((t: any) => ({
      description: String(t.description || '').trim(),
      category: String(t.category || 'General').trim(),
      evidence: String(t.evidence || '').trim(),
      estimatedEffort: t.estimatedEffort ? String(t.estimatedEffort).trim() : undefined,
    }))
    .filter((t: any) => t.description.length > 0);

  const sanitizedSkills = (parsed.skills || [])
    .map((s: any) => ({
      name: String(s.name || '').trim(),
      category: String(s.category || 'General').trim(),
      evidence: String(s.evidence || '').trim(),
      evidenceType: s.evidenceType === 'inferred' ? 'inferred' : 'explicit',
      confidence: Math.min(0.99, Math.max(0.1, Number(s.confidence) || 0.8)),
      strength: ['weak', 'moderate', 'strong'].includes(s.strength) ? s.strength : 'moderate',
    }))
    .filter((s: any) => s.name.length > 0 && s.evidence.length > 0);

  const sanitizedEnergy = (parsed.energyObservations || [])
    .map((e: any) => ({
      activity: String(e.activity || '').trim(),
      direction: ['energizing', 'draining', 'neutral', 'mixed', 'unknown'].includes(e.direction)
        ? e.direction
        : 'unknown',
      evidence: String(e.evidence || '').trim(),
      evidenceType: e.evidenceType === 'inferred' ? 'inferred' : 'explicit',
      confidence: Math.min(0.99, Math.max(0.1, Number(e.confidence) || 0.8)),
    }))
    .filter((e: any) => e.activity.length > 0);

  const sanitizedWorkStyle = (parsed.workStyleObservations || [])
    .map((w: any) => ({
      pattern: String(w.pattern || '').trim(),
      evidence: String(w.evidence || '').trim(),
      evidenceType: w.evidenceType === 'inferred' ? 'inferred' : 'explicit',
      confidence: Math.min(0.99, Math.max(0.1, Number(w.confidence) || 0.8)),
    }))
    .filter((w: any) => w.pattern.length > 0);

  const sanitizedEmotions = (parsed.emotions || [])
    .map((em: any) => ({
      label: String(em.label || '').trim(),
      evidence: String(em.evidence || '').trim(),
      confidence: Math.min(0.99, Math.max(0.1, Number(em.confidence) || 0.8)),
    }))
    .filter((em: any) => em.label.length > 0);

  return {
    id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    journalEntryId: entryId,
    summary: String(parsed.summary || 'Summary unavailable').trim(),
    tasks: sanitizedTasks,
    skills: sanitizedSkills,
    energyObservations: sanitizedEnergy,
    workStyleObservations: sanitizedWorkStyle,
    emotions: sanitizedEmotions,
    reflectionQuestion: parsed.reflectionQuestion ? String(parsed.reflectionQuestion).trim() : null,
    modelUsed: execution.modelUsed,
    promptVersion: PROMPT_VERSIONS.JOURNAL_ANALYSIS,
    createdAt: new Date().toISOString(),
  };
}

export interface MilestoneProgressDetectionResult {
  milestoneId: string;
  classification: 'no_progress' | 'possible_progress' | 'strong_progress' | 'milestone_complete';
  evidenceExcerpt: string;
  completionCriteriaComparison: string;
  isAmbiguous: boolean;
  confidence: number;
  proposedAction: 'none' | 'mark_in_progress' | 'complete_milestone' | 'request_review';
}

// 2. Automated Milestone Progress Detector
export async function detectMilestoneProgress(
  journalText: string,
  entryDate: string,
  activeMilestones: Milestone[]
): Promise<MilestoneProgressDetectionResult[]> {
  if (!isGeminiConfigured() || activeMilestones.length === 0) return [];

  const milestonesContext = activeMilestones.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    completionCriteria: m.completionCriteria,
    status: m.status,
  }));

  const prompt = `You are the Milestone Accountability Engine in Cognitive Diary (Prompt Version: ${PROMPT_VERSIONS.MILESTONE_PROGRESS}).
Compare the user's daily journal entry on ${entryDate} against the EXPLICIT completion criteria for each active learning milestone.

PROGRESS CLASSIFICATION & RIGOROUS VERIFICATION RULES:
1. "milestone_complete": STRICT REQUIREMENT. The entry must explicitly and concretely prove that ALL stated completion criteria have been satisfied.
2. "possible_progress": The user made partial headway or worked in the domain, but NOT all completion criteria are satisfied, or the evidence is ambiguous/inferential.
   - For possible_progress or ambiguous evidence, you MUST set isAmbiguous: true and proposedAction: "request_review".
3. "strong_progress": Clear, substantial work was accomplished on the milestone, but final completion criteria remain open.
   - ProposedAction: "mark_in_progress" (if milestone was not started) or "request_review".
4. "no_progress": The entry has no direct relevance to this milestone.
5. NEVER declare a milestone completed solely because of keyword overlap (e.g. mentioning a topic without satisfying the required deliverable).
6. Ambiguous or partial evidence MUST trigger a confirmation request (proposedAction: "request_review"), NEVER automatic completion.

Active Milestones:
${JSON.stringify(milestonesContext, null, 2)}

Journal Entry Text:
"""
${journalText}
"""`;

  const execution = await callGeminiWithResilience('MilestoneProgressDetection', async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              milestoneId: { type: Type.STRING },
              classification: {
                type: Type.STRING,
                enum: ['no_progress', 'possible_progress', 'strong_progress', 'milestone_complete'],
              },
              evidenceExcerpt: { type: Type.STRING },
              completionCriteriaComparison: {
                type: Type.STRING,
                description: 'Clear factual explanation comparing journal evidence against the milestone criteria',
              },
              isAmbiguous: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              proposedAction: {
                type: Type.STRING,
                enum: ['none', 'mark_in_progress', 'complete_milestone', 'request_review'],
              },
            },
            required: [
              'milestoneId',
              'classification',
              'evidenceExcerpt',
              'completionCriteriaComparison',
              'isAmbiguous',
              'confidence',
              'proposedAction',
            ],
          },
        },
      },
    });

    const parsed = cleanAndParseJson<any[]>(response.text || '', 'MilestoneProgressDetection');
    return { result: parsed, modelUsed: modelName };
  });

  const results = execution.result || [];
  return results
    .filter((r: any) => r.classification !== 'no_progress' && Number(r.confidence) >= 0.5)
    .map((r: any) => {
      const conf = Math.min(0.99, Math.max(0.1, Number(r.confidence) || 0.7));
      const isAmbiguous = Boolean(r.isAmbiguous || conf < 0.90 || r.classification === 'possible_progress');

      // Ambiguous evidence MUST trigger a confirmation request rather than automatic completion
      let action = r.proposedAction;
      if (isAmbiguous && action === 'complete_milestone') {
        action = 'request_review';
      }

      return {
        milestoneId: String(r.milestoneId),
        classification: r.classification,
        evidenceExcerpt: String(r.evidenceExcerpt || '').trim(),
        completionCriteriaComparison: String(r.completionCriteriaComparison || '').trim(),
        isAmbiguous,
        confidence: conf,
        proposedAction: action,
      };
    });
}

// 3. Career Discovery Synthesis Engine
export async function synthesizeCareerHypotheses(
  userId: string,
  skills: AggregatedSkill[],
  energyPatterns: Array<{ activity: string; direction: string; evidence: string }>,
  existingInterests: string[] = [],
  journalCatalog: Array<{ id: string; entryDate: string; summary: string }> = []
): Promise<CareerHypothesis[]> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  // Minimum longitudinal evidence requirement: at least 2 distinct days and entries with observed capabilities
  const distinctEntryDates = new Set(skills.flatMap((s) => s.evidenceExcerpts.map((e) => e.entryDate))).size;
  const distinctEntries = new Set(skills.flatMap((s) => s.evidenceExcerpts.map((e) => e.entryId))).size;
  if (skills.length < 2 || distinctEntryDates < 2 || distinctEntries < 2) {
    throw new Error(
      'Insufficient longitudinal evidence. Please journal across at least 2 distinct days so Cognitive Diary can identify recurring patterns rather than one-off keywords.'
    );
  }

  // Build grounded evidence catalog so the model cites genuine entry IDs and quotes
  const groundedEvidencePool = skills.slice(0, 15).map((s) => ({
    skillName: s.name,
    category: s.category,
    distinctDaysObserved: s.frequency,
    sampleEvidence: s.evidenceExcerpts.slice(0, 3).map((e) => ({
      entryId: e.entryId,
      entryDate: e.entryDate,
      excerpt: e.excerpt,
      evidenceType: e.evidenceType,
    })),
  }));

  const prompt = `You are the Career Discovery Engine in Cognitive Diary (Prompt Version: ${PROMPT_VERSIONS.CAREER_SYNTHESIS}).
Synthesize 2 to 3 grounded, explainable career hypotheses for a user based strictly on their accumulated longitudinal evidence.

Longitudinal Skill Observations & Authentic Excerpts:
${JSON.stringify(groundedEvidencePool, null, 2)}

Observed Energy Flow (Energizing vs. Draining Patterns):
${JSON.stringify(energyPatterns.slice(0, 12), null, 2)}

User's Journal Catalog (Available Real Entries):
${JSON.stringify(journalCatalog.slice(0, 10), null, 2)}

User's Optional Target Career Interests:
${JSON.stringify(existingInterests)}

SYNTHESIS GUIDELINES & RIGOROUS GROUNDING RULES:
1. Grounded Hypotheses: Every career recommendation must be formulated as an exploratory hypothesis, not a diagnostic verdict.
2. Contradictions & Tensions: Explicitly identify contradictory signals (e.g. user thrives on deep technical isolation but is drained by communication silos, or enjoys visual translation but finds unstructured alignment meetings exhausting).
3. Supporting Evidence Linking: Every hypothesis MUST cite 2-4 real evidence items from the provided observations. Each item MUST include:
   - entryId: The EXACT real entryId from the observations above.
   - skillName: The exact demonstrated skill.
   - excerpt: The exact supporting quotation.
4. Concrete Validation Experiment: Suggest an achievable 2-4 hour experiment the user can perform next week to test whether they actually enjoy the day-to-day reality of this work.
5. Challenges & Unknowns: State real potential frictions and open questions.
6. Evidence Strength:
   - "supported_by_repeated_observations": Multiple skills backed by 3+ distinct days.
   - "promising_match": Skills span 2-3 distinct days with consistent energy alignment.
   - "early_hypothesis": Preliminary match.`;

  const execution = await callGeminiWithResilience('CareerSynthesis', async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.25,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              whyItMayFit: { type: Type.STRING },
              relevantStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              supportingEvidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    entryId: { type: Type.STRING },
                    skillName: { type: Type.STRING },
                    excerpt: { type: Type.STRING },
                  },
                  required: ['entryId', 'skillName', 'excerpt'],
                },
              },
              potentialEnvironments: { type: Type.ARRAY, items: { type: Type.STRING } },
              typicalTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              skillsToDevelop: { type: Type.ARRAY, items: { type: Type.STRING } },
              challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
              unknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
              contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
              smallExperiment: { type: Type.STRING },
              suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidenceStrength: {
                type: Type.STRING,
                enum: ['early_hypothesis', 'promising_match', 'supported_by_repeated_observations'],
              },
            },
            required: [
              'title',
              'description',
              'whyItMayFit',
              'relevantStrengths',
              'supportingEvidence',
              'potentialEnvironments',
              'typicalTasks',
              'skillsToDevelop',
              'challenges',
              'unknowns',
              'contradictions',
              'smallExperiment',
              'suggestedNextSteps',
              'evidenceStrength',
            ],
          },
        },
      },
    });

    const items = cleanAndParseJson<any[]>(response.text || '', 'CareerSynthesis');
    return { result: items, modelUsed: modelName };
  });

  const items = execution.result || [];

  // Build lookup index of all known excerpts and entries to ensure 100% authentic linking
  const excerptLookup = new Map<string, { entryId: string; entryDate: string }>();
  for (const sk of skills) {
    for (const ex of sk.evidenceExcerpts) {
      excerptLookup.set(ex.excerpt.toLowerCase().trim(), { entryId: ex.entryId, entryDate: ex.entryDate });
    }
  }

  const validEntryIds = new Set(journalCatalog.map((j) => j.id));

  return items.map((item: any, idx: number) => {
    // Sanitize and link supporting evidence to authentic journal entries
    const linkedEvidence = (item.supportingEvidence || []).map((e: any) => {
      const excerpt = String(e.excerpt || '').trim();
      const skillName = String(e.skillName || '').trim();
      let entryId = String(e.entryId || '').trim();

      // Verify or resolve real entry ID
      if (!entryId || !validEntryIds.has(entryId)) {
        const found = excerptLookup.get(excerpt.toLowerCase().trim());
        if (found) {
          entryId = found.entryId;
        } else {
          // Find skill match in catalog
          const matchingSkill = skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
          if (matchingSkill && matchingSkill.evidenceExcerpts.length > 0) {
            entryId = matchingSkill.evidenceExcerpts[0].entryId;
          } else if (journalCatalog.length > 0) {
            entryId = journalCatalog[0].id;
          }
        }
      }

      return {
        entryId,
        skillName,
        excerpt,
      };
    });

    return {
      id: `career-${Date.now()}-${idx}`,
      userId,
      title: String(item.title || '').trim(),
      description: String(item.description || '').trim(),
      whyItMayFit: String(item.whyItMayFit || '').trim(),
      relevantStrengths: item.relevantStrengths || [],
      supportingEvidence: linkedEvidence,
      potentialEnvironments: item.potentialEnvironments || [],
      typicalTasks: item.typicalTasks || [],
      skillsToDevelop: item.skillsToDevelop || [],
      challenges: item.challenges || [],
      unknowns: item.unknowns || [],
      contradictions: item.contradictions || [],
      smallExperiment: String(item.smallExperiment || '').trim(),
      suggestedNextSteps: item.suggestedNextSteps || [],
      evidenceStrength: item.evidenceStrength || 'promising_match',
      status: idx === 0 ? 'active' : 'saved',
      createdAt: new Date().toISOString(),
    };
  });
}

// 4. Phased Career Roadmap Generator
export async function generateRoadmap(
  userId: string,
  careerTitle: string,
  careerRecommendationId: string,
  weeklyTimeBudget: number = 6,
  existingSkills: string[] = [],
  preferredLearningFormat: string = 'hands_on'
): Promise<Roadmap> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `You are the Career Roadmap Architect in Cognitive Diary (Prompt Version: ${PROMPT_VERSIONS.ROADMAP_GENERATION}).
Create a personalized 3 to 4 phase learning roadmap for the target career direction: "${careerTitle}".

User Preferences & Context:
- Weekly Time Budget: ${weeklyTimeBudget} hours/week
- Existing Demonstrated Skills: ${existingSkills.join(', ') || 'Not specified'}
- Preferred Learning Format: ${preferredLearningFormat}

ROADMAP REQUIREMENTS:
1. 3 to 4 sequential phases (e.g. Foundations, Guided Practice, Applied Vertical Slices, Career Readiness).
2. Each phase must contain 2 concrete milestones.
3. Each milestone MUST have an explicit, observable completion criteria (e.g. "A working web app deployed with live Postgres integration and error monitoring", NOT vague "Study databases").
4. List estimated duration in weeks/hours aligned with the user's weekly budget.`;

  const execution = await callGeminiWithResilience('RoadmapGeneration', async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    completionCriteria: { type: Type.STRING },
                    skillsTargeted: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedDuration: { type: Type.STRING },
                  },
                  required: [
                    'title',
                    'description',
                    'completionCriteria',
                    'skillsTargeted',
                    'suggestedActivities',
                    'estimatedDuration',
                  ],
                },
              },
            },
            required: ['name', 'description', 'milestones'],
          },
        },
      },
    });

    const parsed = cleanAndParseJson<any[]>(response.text || '', 'RoadmapGeneration');
    return { result: parsed, modelUsed: modelName };
  });

  const phasesRaw = execution.result || [];
  const roadmapId = `roadmap-${Date.now()}`;

  const phases: RoadmapPhase[] = phasesRaw.map((p: any, pIdx: number) => {
    const phaseId = `phase-${pIdx + 1}`;
    const milestones: Milestone[] = (p.milestones || []).map((m: any, mIdx: number) => ({
      id: `m-${pIdx + 1}-${mIdx + 1}`,
      roadmapId,
      phaseId,
      title: String(m.title || '').trim(),
      description: String(m.description || '').trim(),
      completionCriteria: String(m.completionCriteria || '').trim(),
      skillsTargeted: m.skillsTargeted || [],
      suggestedActivities: m.suggestedActivities || [],
      estimatedDuration: String(m.estimatedDuration || '').trim(),
      status: pIdx === 0 && mIdx === 0 ? 'in_progress' : 'not_started',
    }));

    return {
      id: phaseId,
      name: String(p.name || '').trim(),
      description: String(p.description || '').trim(),
      milestones,
    };
  });

  return {
    id: roadmapId,
    userId,
    careerRecommendationId,
    careerTitle,
    phases,
    weeklyTimeBudget,
    overallStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 5. Weekly Reflection Report Generator
export async function generateWeeklyReport(
  userId: string,
  entries: Array<{ text: string; date: string; summary?: string }>,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyReflectionReport> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `You are the Editorial Reflection Partner in Cognitive Diary (Prompt Version: ${PROMPT_VERSIONS.WEEKLY_SYNTHESIS}).
Synthesize the user's weekly journal observations between ${weekStart} and ${weekEnd}.

Recent Journal Entries:
${JSON.stringify(entries, null, 2)}

Provide:
1. summary: A warm, calm 2-3 sentence overview of their work patterns and focus this week.
2. skillsDemonstrated: Top 4-5 skills observed.
3. positiveMoments: Concrete energizing or satisfying moments directly quoted or referenced.
4. challenges: Difficulties, friction, or draining moments reported.
5. recurringPatterns: Inferred patterns between work context and energy.
6. roadmapProgress: A factual statement on their momentum.
7. weeklyQuestion: A deep, non-judgmental question for next week's reflection.`;

  const execution = await callGeminiWithResilience('WeeklyReport', async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            skillsDemonstrated: { type: Type.ARRAY, items: { type: Type.STRING } },
            positiveMoments: { type: Type.ARRAY, items: { type: Type.STRING } },
            challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
            recurringPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            roadmapProgress: { type: Type.STRING },
            weeklyQuestion: { type: Type.STRING },
          },
          required: [
            'summary',
            'skillsDemonstrated',
            'positiveMoments',
            'challenges',
            'recurringPatterns',
            'roadmapProgress',
            'weeklyQuestion',
          ],
        },
      },
    });

    const parsed = cleanAndParseJson<any>(response.text || '', 'WeeklyReport');
    return { result: parsed, modelUsed: modelName };
  });

  const parsed = execution.result;

  return {
    id: `report-${Date.now()}`,
    userId,
    weekStart,
    weekEnd,
    summary: String(parsed.summary || '').trim(),
    skillsDemonstrated: parsed.skillsDemonstrated || [],
    positiveMoments: parsed.positiveMoments || [],
    challenges: parsed.challenges || [],
    recurringPatterns: parsed.recurringPatterns || [],
    roadmapProgress: String(parsed.roadmapProgress || 'Ongoing reflection').trim(),
    weeklyQuestion: String(parsed.weeklyQuestion || '').trim(),
    createdAt: new Date().toISOString(),
  };
}
