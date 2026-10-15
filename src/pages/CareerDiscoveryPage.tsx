import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Compass,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FlaskConical,
  BookOpen,
  MapPin,
  Columns,
  X,
} from 'lucide-react';
import { CareerHypothesis } from '../types/index.ts';

export const CareerDiscoveryPage: React.FC = () => {
  const { careers, skills, refreshData, setActiveTab, setEditingEntryId } = useApp();

  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerHypothesis | null>(
    careers[0] || null
  );
  const [compareList, setCompareList] = useState<CareerHypothesis[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [adopting, setAdopting] = useState(false);

  // Keep selected career in sync
  React.useEffect(() => {
    if (careers.length > 0 && !selectedCareer) {
      setSelectedCareer(careers[0]);
    } else if (careers.length > 0 && selectedCareer) {
      const updated = careers.find((c) => c.id === selectedCareer.id);
      if (updated) setSelectedCareer(updated);
    }
  }, [careers, selectedCareer]);

  const handleSynthesize = async () => {
    setSynthesizing(true);
    setSynthesisError(null);
    try {
      const newHypotheses = await api.synthesizeCareers();
      await refreshData();
      if (newHypotheses.length > 0) {
        setSelectedCareer(newHypotheses[0]);
      }
    } catch (err: any) {
      setSynthesisError(err.message || 'Career synthesis failed. Please ensure Gemini API is configured.');
    } finally {
      setSynthesizing(false);
    }
  };

  const handleToggleCompare = (career: CareerHypothesis) => {
    if (compareList.some((c) => c.id === career.id)) {
      setCompareList(compareList.filter((c) => c.id !== career.id));
    } else {
      if (compareList.length >= 3) {
        return;
      }
      setCompareList([...compareList, career]);
    }
  };

  const handleAdoptRoadmap = async (career: CareerHypothesis) => {
    setAdopting(true);
    setSynthesisError(null);
    try {
      await api.generateRoadmap(career.title, career.id);
      await refreshData();
      setActiveTab('roadmap');
    } catch (err: any) {
      setSynthesisError(`Could not generate roadmap: ${err.message}`);
    } finally {
      setAdopting(false);
    }
  };

  const distinctEntryDates = skills.length > 0
    ? new Set(skills.flatMap((s) => s.evidenceExcerpts.map((e) => e.entryDate))).size
    : 0;
  const hasSufficientEvidence = skills.length >= 2 && distinctEntryDates >= 2;

  const activeHypotheses = careers.filter((c) => c.status !== 'dismissed');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Career Discovery
          </h1>
          <p className="text-xs text-[#5C6059] mt-1">
            Explainable career hypotheses synthesized from your demonstrated skills and energy patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {compareList.length >= 2 && (
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-3 py-2 bg-white border border-[#3E5A46] text-[#3E5A46] hover:bg-[#EEF4EE] text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare Selected ({compareList.length})</span>
            </button>
          )}

          <button
            onClick={handleSynthesize}
            disabled={synthesizing || !hasSufficientEvidence}
            title={!hasSufficientEvidence ? 'Requires at least 2 distinct days of journaling' : undefined}
            className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {synthesizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Evidence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize Career Hypotheses</span>
              </>
            )}
          </button>
        </div>
      </div>

      {synthesisError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-start justify-between">
          <span>{synthesisError}</span>
          <button onClick={() => setSynthesisError(null)} className="text-[#991B1B] font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Longitudinal Evidence Threshold Banner if not yet reached */}
      {!hasSufficientEvidence && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#78350F]">Longitudinal Evidence Gathering in Progress</p>
            <p className="text-[11px] leading-relaxed text-[#92400E]">
              Career synthesis strictly requires at least 2 distinct days of journaling to discover repeatable patterns and genuine capabilities rather than isolated keywords. Current progress: <strong>{distinctEntryDates} / 2 days</strong> logged.
            </p>
          </div>
        </div>
      )}

      {/* Observational Context Banner */}
      <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs text-[#5C6059] flex items-start gap-3">
        <Compass className="w-4 h-4 text-[#3E5A46] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#222421]">Career Hypotheses, Not Life Sentences</p>
          <p className="text-[11px] leading-relaxed">
            These recommendations do not claim certainty. They are evidence-grounded hypotheses showing which career pathways leverage what you naturally do well and find energizing. Every recommendation is linked directly to your authentic journal entries.
          </p>
        </div>
      </div>

      {activeHypotheses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E6E3DE] rounded-lg space-y-4">
          <Compass className="w-10 h-10 text-[#878D82] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#222421]">Gathering Longitudinal Evidence</h3>
            <p className="text-xs text-[#5C6059] max-w-md mx-auto">
              Write at least 2 to 3 journal entries about what you worked on. Once enough evidence is gathered, click &ldquo;Synthesize Career Hypotheses&rdquo; to analyze your trajectory.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('journal')}
            className="px-4 py-2 bg-[#3E5A46] text-white text-xs font-semibold rounded hover:bg-[#2A4031] transition-colors"
          >
            Write an Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Hypotheses Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {activeHypotheses.map((career) => {
              const isSelected = selectedCareer?.id === career.id;
              const isCompared = compareList.some((c) => c.id === career.id);

              return (
                <div
                  key={career.id}
                  onClick={() => setSelectedCareer(career)}
                  className={`p-5 bg-white border rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#3E5A46] ring-1 ring-[#3E5A46] shadow-xs'
                      : 'border-[#E6E3DE] hover:border-[#D5D2CC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#222421]">{career.title}</h3>
                      <span className="text-[11px] text-[#3E5A46] font-medium block mt-0.5">
                        {career.evidenceStrength === 'supported_by_repeated_observations'
                          ? 'Supported by repeated observations'
                          : career.evidenceStrength === 'promising_match'
                          ? 'Promising Match'
                          : 'Early Hypothesis'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(career)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          isCompared
                            ? 'bg-[#EEF4EE] border-[#3E5A46] text-[#2A4031] font-semibold'
                            : 'bg-white border-[#D5D2CC] text-[#5C6059] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {isCompared ? 'Compared' : '+ Compare'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C6059] leading-relaxed line-clamp-2">
                    {career.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#F2EFEB] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#878D82]">
                      {career.relevantStrengths.slice(0, 2).join(' · ')}
                    </span>
                    <span className="text-[#3E5A46] font-medium text-[11px] flex items-center gap-1">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: In-Depth Explanation & Action Pane (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E6E3DE] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
            {selectedCareer ? (
              <>
                {/* Header & Status */}
                <div className="border-b border-[#E6E3DE] pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#52745C] font-semibold tracking-wide uppercase">
                      Evidence-Backed Hypothesis
                    </span>
                    <span className="text-xs text-[#878D82]">
                      Created {new Date(selectedCareer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#222421]">
                    {selectedCareer.title}
                  </h2>
                  <p className="text-xs text-[#5C6059] leading-relaxed">
                    {selectedCareer.description}
                  </p>
                </div>

                {/* Why It May Fit (Evidence Reasoning) */}
                <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs space-y-2">
                  <span className="font-semibold text-[#222421] block">Why this hypothesis fits you:</span>
                  <p className="text-[#444840] leading-relaxed">{selectedCareer.whyItMayFit}</p>
                </div>

                {/* Supporting Observed Strengths */}
                <div className="space-y-2.5">
                  <span className="font-semibold text-xs text-[#222421] block">
                    Observed Supporting Strengths
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#3E5A46]">
                    {selectedCareer.relevantStrengths.map((str, idx) => (
                      <span key={idx} className="font-medium">
                        {str}
                        {idx < selectedCareer.relevantStrengths.length - 1 && (
                          <span className="text-[#D5D2CC] ml-4">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grounded Journal Evidence Linking (Every recommendation linked to real entries) */}
                {selectedCareer.supportingEvidence && selectedCareer.supportingEvidence.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-[#F2EFEB]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#222421]">
                        Supporting Journal Evidence ({selectedCareer.supportingEvidence.length})
                      </span>
                      <span className="text-[11px] text-[#878D82]">
                        Grounding verifiable in journal history
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedCareer.supportingEvidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-1.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-medium text-[#3E5A46] text-[10px] bg-[#EEF4EE] px-1.5 py-0.5 rounded">
                                {ev.skillName}
                              </span>
                              {ev.entryId && (
                                <button
                                  onClick={() => {
                                    setEditingEntryId(ev.entryId);
                                    setActiveTab('journal');
                                  }}
                                  className="text-[10px] text-[#3E5A46] hover:underline flex items-center gap-1 font-semibold"
                                  title="Open this journal entry"
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>View Entry</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[#444840] italic text-[11px] leading-relaxed">
                              &ldquo;{ev.excerpt}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contradictions & Behavioral Tensions */}
                {selectedCareer.contradictions && selectedCareer.contradictions.length > 0 && (
                  <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#92400E] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Observed Behavioral Contradictions & Tensions</span>
                    </div>
                    <ul className="space-y-1 text-[#78350F] pl-4 list-disc text-[11px]">
                      {selectedCareer.contradictions.map((c, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Two-Column Breakdown: Typical Tasks & Skills to Develop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#F2EFEB] text-xs">
                  <div>
                    <span className="font-semibold text-[#222421] block mb-2">Typical Daily Tasks</span>
                    <ul className="space-y-1.5 text-[#5C6059]">
                      {selectedCareer.typicalTasks.map((task, idx) => (
                        <li key={idx} className="pl-2 border-l border-[#D5D2CC]">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-[#222421] block mb-2">Skills to Develop</span>
                    <ul className="space-y-1.5 text-[#5C6059]">
                      {selectedCareer.skillsToDevelop.map((gap, idx) => (
                        <li key={idx} className="pl-2 border-l border-[#A34E36]">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Challenges & Unknowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-[#F2EFEB]">
                  <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                    <span className="font-semibold text-[#222421] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      Potential Friction
                    </span>
                    <p className="text-[11px] text-[#6F746B]">
                      {selectedCareer.challenges.join(' · ')}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                    <span className="font-semibold text-[#222421] flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#878D82]" />
                      What Remains Unknown
                    </span>
                    <p className="text-[11px] text-[#6F746B]">
                      {selectedCareer.unknowns.join(' · ')}
                    </p>
                  </div>
                </div>

                {/* Small Validation Experiment */}
                <div className="p-4 bg-[#EEF4EE]/60 border border-[#DCE7DC] rounded-lg text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-[#2A4031] font-semibold">
                    <FlaskConical className="w-4 h-4 text-[#3E5A46]" />
                    <span>Small Experiment to Test Fit (2–4 Hours)</span>
                  </div>
                  <p className="text-[#1e3425] leading-relaxed">
                    {selectedCareer.smallExperiment}
                  </p>
                </div>

                {/* Action Strip: Turn into Roadmap */}
                <div className="pt-4 border-t border-[#E6E3DE] flex items-center justify-between">
                  <span className="text-xs text-[#878D82]">
                    Ready to structure a practical learning plan?
                  </span>
                  <button
                    onClick={() => handleAdoptRoadmap(selectedCareer)}
                    disabled={adopting}
                    className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{adopting ? 'Building Roadmap...' : 'Adopt as Active Roadmap'}</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-[#878D82] py-16">
                Select a career hypothesis to view detailed evidence and experiments.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Career Comparison Modal (Section 11) */}
      {showComparisonModal && compareList.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-2xl max-w-5xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE]">
              <div>
                <h2 className="font-editorial text-xl font-semibold text-[#222421]">
                  Compare Career Hypotheses
                </h2>
                <p className="text-xs text-[#5C6059] mt-0.5">
                  Side-by-side evaluation of daily characteristics, friction points, and validation experiments.
                </p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1 text-[#878D82] hover:text-[#222421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {compareList.map((career) => (
                <div key={career.id} className="p-4 border border-[#E6E3DE] rounded-lg bg-[#FAF8F5] space-y-4">
                  <div className="border-b border-[#E6E3DE] pb-2">
                    <h3 className="font-semibold text-sm text-[#222421]">{career.title}</h3>
                    <span className="text-[10px] text-[#3E5A46] font-medium block mt-0.5">
                      {career.evidenceStrength.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                      Core Fit Rationale
                    </span>
                    <p className="text-[#444840] leading-relaxed text-[11px]">
                      {career.whyItMayFit}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                      Observed Strengths
                    </span>
                    <p className="text-[#222421] font-medium text-[11px]">
                      {career.relevantStrengths.join(', ')}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                      Potential Friction
                    </span>
                    <p className="text-[#6F746B] text-[11px]">
                      {career.challenges.join('; ')}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                      Validation Experiment
                    </span>
                    <p className="text-[#1e3425] text-[11px] bg-white p-2 rounded border border-[#E6E3DE]">
                      {career.smallExperiment}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowComparisonModal(false);
                      handleAdoptRoadmap(career);
                    }}
                    className="w-full py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors"
                  >
                    Adopt This Track
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
