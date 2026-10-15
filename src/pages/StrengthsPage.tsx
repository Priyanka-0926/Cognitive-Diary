import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AggregatedSkill, UserFeedbackType } from '../types/index.ts';
import { SkillsRadarChart } from '../components/charts/SkillsRadarChart.tsx';

export const StrengthsPage: React.FC = () => {
  const { skills, selectedSkillId, setSelectedSkillId, refreshData, setEditingEntryId, setActiveTab } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<AggregatedSkill | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'bars' | 'radar'>('bars');

  // Sync selected skill with context
  React.useEffect(() => {
    if (selectedSkillId) {
      const match = skills.find((s) => s.normalizedId === selectedSkillId);
      if (match) setSelectedSkill(match);
    } else if (skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0]);
    }
  }, [selectedSkillId, skills, selectedSkill]);

  const categories = useMemo(() => {
    const set = new Set(skills.map((s) => s.category));
    return ['all', ...Array.from(set)];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    if (categoryFilter === 'all') return skills;
    return skills.filter((s) => s.category === categoryFilter);
  }, [skills, categoryFilter]);

  const handleFeedback = async (skillId: string, feedback: UserFeedbackType) => {
    setFeedbackLoading(true);
    try {
      await api.submitSkillFeedback(skillId, feedback);
      await refreshData();
      if (selectedSkill && selectedSkill.normalizedId === skillId) {
        setSelectedSkill({ ...selectedSkill, userFeedback: feedback });
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Radar polygon data
  const radarData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of skills) {
      counts[s.category] = (counts[s.category] || 0) + s.frequency;
    }
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
    }));
  }, [skills]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of skills) {
      counts[s.category] = (counts[s.category] || 0) + s.frequency;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([cat, count]) => ({
      category: cat,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [skills]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Evidence-Based Strengths
          </h1>
          <p className="text-xs text-[#5C6059] mt-1">
            Strengths detected through repeated actions in your daily work, not self-reported guesses.
          </p>
        </div>

        {/* View Toggle & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode */}
          <div className="flex items-center gap-1 p-1 bg-[#EAE8E3] rounded text-xs">
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'bars' ? 'bg-white text-[#222421] shadow-xs' : 'text-[#5C6059] hover:text-[#222421]'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'radar' ? 'bg-white text-[#222421] shadow-xs' : 'text-[#5C6059] hover:text-[#222421]'
              }`}
            >
              Radar Map
            </button>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-medium rounded capitalize whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#3E5A46] text-white shadow-xs'
                    : 'bg-white border border-[#D5D2CC] text-[#5C6059] hover:text-[#222421]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Observational Context Banner */}
      <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs text-[#5C6059] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#3E5A46] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#222421]">Frequency is not ability.</p>
          <p className="text-[11px] leading-relaxed">
            Tasks you perform often show sustained context and familiarity. Combine frequency with your personal calibration ratings to guide your career roadmap.
          </p>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E6E3DE] rounded-lg space-y-3">
          <Layers className="w-8 h-8 text-[#878D82] mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-[#222421]">No skills observed yet</h3>
          <p className="text-xs text-[#5C6059] max-w-md mx-auto">
            Write daily journal entries describing what you built, debugged, designed, or coordinated to begin discovering your patterns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Skill Cards or Radar Chart (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {viewMode === 'radar' && (
              <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs flex flex-col items-center space-y-4">
                <span className="text-xs font-semibold text-[#222421]">Capability Distribution Radar</span>
                <SkillsRadarChart data={radarData} size={300} />
                <p className="text-[11px] text-[#878D82] text-center max-w-sm">
                  Polygon web illustrates relative concentration of observed evidence across functional categories.
                </p>
              </div>
            )}

            {filteredSkills.map((skill) => {
              const isSelected = selectedSkill?.normalizedId === skill.normalizedId;
              const explicitCount = skill.evidenceExcerpts.filter((e) => e.evidenceType === 'explicit').length;

              return (
                <div
                  key={skill.normalizedId}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setSelectedSkillId(skill.normalizedId);
                  }}
                  className={`p-4 bg-white border rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#3E5A46] ring-1 ring-[#3E5A46] shadow-xs'
                      : 'border-[#E6E3DE] hover:border-[#D5D2CC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#222421]">{skill.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#878D82] mt-0.5">
                        <span>{skill.category}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">
                          {skill.frequency} {skill.frequency === 1 ? 'observation' : 'observations'}
                        </span>
                        <span>·</span>
                        <span>{explicitCount} explicit</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {skill.userFeedback && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            skill.userFeedback === 'accurate'
                              ? 'bg-[#EEF4EE] text-[#2A4031]'
                              : skill.userFeedback === 'partially_accurate'
                              ? 'bg-[#FFFBEB] text-[#B45309]'
                              : 'bg-[#FEF2F2] text-[#991B1B]'
                          }`}
                        >
                          {skill.userFeedback.replace('_', ' ')}
                        </span>
                      )}
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-[#3E5A46] translate-x-0.5' : 'text-[#D5D2CC]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Horizontal Evidence Strength Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#878D82]">
                      <span>Evidence Quality</span>
                      <span className="font-mono-tabular">
                        {Math.round(skill.averageConfidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE8E3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#3E5A46] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(skill.averageConfidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Sample Excerpt Preview */}
                  {skill.evidenceExcerpts[0] && (
                    <p className="text-[11px] text-[#6F746B] italic mt-2 line-clamp-1">
                      &ldquo;{skill.evidenceExcerpts[0].excerpt}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}

            {/* Category Distribution Breakdown Strip */}
            <div className="p-5 bg-white border border-[#E6E3DE] rounded-lg space-y-3">
              <span className="text-xs font-semibold text-[#222421] block">
                Evidence Category Balance
              </span>
              <div className="space-y-2">
                {categoryStats.map((stat) => (
                  <div key={stat.category} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#5C6059]">
                      <span className="font-medium">{stat.category}</span>
                      <span className="font-mono-tabular">
                        {stat.count} ({stat.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE8E3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#52745C] h-full rounded-full"
                        style={{ width: `${stat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Skill Detail & Evidence Traceability View (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E6E3DE] rounded-lg p-6 shadow-xs sticky top-20 space-y-6">
            {selectedSkill ? (
              <>
                <div className="border-b border-[#E6E3DE] pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#3E5A46] uppercase tracking-wide">
                      {selectedSkill.category} Capability
                    </span>
                    <span className="text-xs font-mono-tabular text-[#878D82]">
                      {selectedSkill.frequency} total entries
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-[#222421] font-editorial">
                    {selectedSkill.name}
                  </h2>
                  <p className="text-xs text-[#5C6059]">
                    Observed between {selectedSkill.firstObservedDate} and {selectedSkill.lastObservedDate}.
                  </p>
                </div>

                {/* User Feedback & Calibration */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E3DE] rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#222421]">Calibrate this interpretation:</span>
                    <span className="text-[10px] text-[#878D82]">Refines career matching</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={feedbackLoading}
                      onClick={() => handleFeedback(selectedSkill.normalizedId, 'accurate')}
                      className={`px-2 py-1.5 text-xs rounded border text-center transition-colors ${
                        selectedSkill.userFeedback === 'accurate'
                          ? 'bg-[#EEF4EE] border-[#3E5A46] text-[#2A4031] font-semibold'
                          : 'bg-white border-[#D5D2CC] text-[#5C6059] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      Accurate
                    </button>
                    <button
                      type="button"
                      disabled={feedbackLoading}
                      onClick={() => handleFeedback(selectedSkill.normalizedId, 'partially_accurate')}
                      className={`px-2 py-1.5 text-xs rounded border text-center transition-colors ${
                        selectedSkill.userFeedback === 'partially_accurate'
                          ? 'bg-[#FFFBEB] border-[#D97706] text-[#B45309] font-semibold'
                          : 'bg-white border-[#D5D2CC] text-[#5C6059] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      Partial
                    </button>
                    <button
                      type="button"
                      disabled={feedbackLoading}
                      onClick={() => handleFeedback(selectedSkill.normalizedId, 'inaccurate')}
                      className={`px-2 py-1.5 text-xs rounded border text-center transition-colors ${
                        selectedSkill.userFeedback === 'inaccurate'
                          ? 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] font-semibold'
                          : 'bg-white border-[#D5D2CC] text-[#5C6059] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      Inaccurate
                    </button>
                  </div>
                </div>

                {/* Traceable Supporting Journal Entries */}
                <div className="space-y-3">
                  <span className="font-semibold text-xs text-[#222421] block">
                    Traceable Supporting Journal Entries ({selectedSkill.evidenceExcerpts.length})
                  </span>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {selectedSkill.evidenceExcerpts.map((excerpt, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-2 hover:border-[#D5D2CC] transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#878D82]">
                          <span className="font-mono-tabular font-medium text-[#222421]">
                            {excerpt.entryDate}
                          </span>
                          <span className="capitalize">{excerpt.evidenceType}</span>
                        </div>

                        <p className="text-[11px] text-[#444840] leading-relaxed italic bg-white p-2.5 rounded border border-[#E6E3DE]">
                          &ldquo;{excerpt.excerpt}&rdquo;
                        </p>

                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setEditingEntryId(excerpt.entryId);
                              setActiveTab('journal');
                            }}
                            className="text-[11px] text-[#3E5A46] font-medium hover:underline flex items-center gap-1"
                          >
                            <span>Open original entry</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#878D82] text-center py-12">
                Select a skill on the left to inspect supporting evidence.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
