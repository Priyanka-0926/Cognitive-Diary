import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Search,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RotateCcw,
} from 'lucide-react';
import { JournalEntry } from '../types/index.ts';

export const JournalHistoryPage: React.FC = () => {
  const { entries, skills, setEditingEntryId, setActiveTab, refreshData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
  const [selectedEnergyFilter, setSelectedEnergyFilter] = useState<string>('all');
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<{ id: string; message: string } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSkillFilter('all');
    setSelectedEnergyFilter('all');
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = entry.originalText.toLowerCase().includes(q);
        const matchesSummary = entry.analysis?.summary.toLowerCase().includes(q);
        const matchesSkills = entry.analysis?.skills.some((s) => s.name.toLowerCase().includes(q));
        if (!matchesText && !matchesSummary && !matchesSkills) return false;
      }

      // Skill filter
      if (selectedSkillFilter !== 'all') {
        const hasSkill = entry.analysis?.skills.some(
          (s) => s.name.toLowerCase() === selectedSkillFilter.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      // Energy filter
      if (selectedEnergyFilter !== 'all') {
        const hasEnergy = entry.analysis?.energyObservations.some(
          (e) => e.direction === selectedEnergyFilter
        );
        if (!hasEnergy) return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedSkillFilter, selectedEnergyFilter]);

  const handleDeleteEntry = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteJournalEntry(id);
      setDeleteConfirmId(null);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetryAnalysis = async (id: string) => {
    setRetryingId(id);
    setRetryError(null);
    try {
      await api.retryAnalysis(id);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to retry analysis:', err);
      setRetryError({ id, message: err.message || 'Retry analysis failed' });
    } finally {
      setRetryingId(null);
    }
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSkillFilter !== 'all' ||
    selectedEnergyFilter !== 'all';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Journal Archive
          </h1>
          <p className="text-xs text-[#5C6059] mt-1">
            Search, filter, and review your past reflections and extracted evidence.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntryId(null);
            setActiveTab('journal');
          }}
          className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#878D82] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, tasks, or insights..."
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#878D82] hover:text-[#222421]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Skill Filter Dropdown */}
        <div className="w-full md:w-56">
          <select
            value={selectedSkillFilter}
            onChange={(e) => setSelectedSkillFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#D5D2CC] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
          >
            <option value="all">All Demonstrated Skills</option>
            {skills.map((s) => (
              <option key={s.normalizedId} value={s.name}>
                {s.name} ({s.frequency})
              </option>
            ))}
          </select>
        </div>

        {/* Energy Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedEnergyFilter}
            onChange={(e) => setSelectedEnergyFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#D5D2CC] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
          >
            <option value="all">All Energy Types</option>
            <option value="energizing">Energizing Only</option>
            <option value="draining">Draining Only</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs text-[#5C6059] hover:text-[#222421] border border-[#D5D2CC] rounded flex items-center justify-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-[#878D82] px-1">
        <span>
          Showing {filteredEntries.length} of {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'}
        </span>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E6E3DE] rounded-lg space-y-3">
          <Calendar className="w-8 h-8 text-[#878D82] mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-[#222421]">No matching journal entries</h3>
          <p className="text-xs text-[#5C6059] max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No reflections matched your current search and filter combination.'
              : 'Your story starts here. Write a few sentences about something you worked on today.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-[#3E5A46] border border-[#3E5A46] rounded hover:bg-[#EEF4EE]"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedEntryIds.has(entry.id);
            const analysis = entry.analysis;

            return (
              <div
                key={entry.id}
                className="bg-white border border-[#E6E3DE] rounded-lg shadow-xs overflow-hidden transition-all"
              >
                {/* Header row */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FAF8F5]/60 border-b border-[#E6E3DE]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular text-xs font-semibold text-[#222421]">
                      {entry.entryDate}
                    </span>
                    <span className="text-[#878D82] text-xs">·</span>
                    <span className="text-xs text-[#5C6059]">
                      {entry.wordCount} words
                    </span>
                    <span className="text-[#878D82] text-xs">·</span>
                    <span className="text-[11px] text-[#5C6059] flex items-center gap-1">
                      {entry.analysisStatus === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3E5A46]" />
                          <span>Analyzed</span>
                        </>
                      ) : entry.analysisStatus === 'analyzing' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
                          <span>Retry Needed</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {entry.analysisStatus === 'needs_retry' && (
                      <button
                        onClick={() => handleRetryAnalysis(entry.id)}
                        disabled={retryingId === entry.id}
                        className="px-2.5 py-1 text-xs text-[#B45309] font-medium border border-[#FDE68A] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Retry Gemini AI Analysis"
                      >
                        <RotateCcw className={`w-3 h-3 ${retryingId === entry.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === entry.id ? 'Analyzing...' : 'Retry AI'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingEntryId(entry.id);
                        setActiveTab('journal');
                      }}
                      className="px-2.5 py-1 text-xs text-[#5C6059] hover:text-[#222421] border border-[#D5D2CC] rounded hover:bg-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="p-1.5 text-[#878D82] hover:text-[#B91C1C] border border-transparent hover:border-[#FCA5A5] rounded hover:bg-[#FEF2F2] transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="px-2.5 py-1 text-xs text-[#3E5A46] font-medium border border-[#DCE7DC] bg-[#EEF4EE]/50 hover:bg-[#EEF4EE] rounded transition-colors flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Analysis' : 'View Analysis'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Entry Body */}
                <div className="p-6 space-y-4">
                  <p className="text-sm leading-relaxed text-[#222421] whitespace-pre-wrap font-sans">
                    {entry.originalText}
                  </p>

                  {/* Inline error for this entry if retry failed */}
                  {retryError && retryError.id === entry.id && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{retryError.message}</span>
                    </div>
                  )}

                  {/* Quick skill indicators */}
                  {analysis && analysis.skills.length > 0 && (
                    <div className="pt-3 border-t border-[#F2EFEB] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C6059]">
                      <span className="font-semibold text-[#222421]">Demonstrated:</span>
                      {analysis.skills.map((s, idx) => (
                        <span key={idx} className="text-[#3E5A46] font-medium">
                          {s.name}
                          {idx < analysis.skills.length - 1 && <span className="text-[#D5D2CC] ml-3">·</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded AI Analysis Card */}
                {isExpanded && (
                  <div className="p-6 bg-[#FAF8F5] border-t border-[#E6E3DE] space-y-5 text-xs animate-fadeIn">
                    {entry.analysisStatus === 'needs_retry' && (
                      <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#991B1B] font-semibold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>AI Analysis Status: Needs Retry</span>
                          </div>
                          <button
                            onClick={() => handleRetryAnalysis(entry.id)}
                            disabled={retryingId === entry.id}
                            className="px-3 py-1 bg-[#B45309] text-white rounded font-medium hover:bg-[#92400E] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingId === entry.id ? 'animate-spin' : ''}`} />
                            <span>{retryingId === entry.id ? 'Retrying...' : 'Retry Analysis'}</span>
                          </button>
                        </div>
                        <p className="text-[#7F1D1D] text-xs">
                          {entry.analysisError || 'Gemini API key is required to synthesize natural skills and energy patterns.'}
                        </p>
                      </div>
                    )}
                    {analysis && (
                      <>
                        {/* Summary */}
                        <div>
                          <span className="text-[11px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                            AI Synthesis Summary
                          </span>
                          <p className="text-[#222421] leading-relaxed">{analysis.summary}</p>
                        </div>

                    {/* Skills Breakdown with Excerpt Evidence */}
                    <div>
                      <span className="text-[11px] font-semibold text-[#878D82] uppercase tracking-wide block mb-2">
                        Observed Skills & Concrete Evidence
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.skills.map((s, idx) => (
                          <div key={idx} className="p-3 bg-white border border-[#E6E3DE] rounded space-y-1">
                            <div className="flex items-center justify-between font-semibold text-[#222421]">
                              <span>{s.name}</span>
                              <span className="text-[10px] text-[#878D82] font-mono-tabular">
                                {Math.round(s.confidence * 100)}% conf
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6F746B] italic">&ldquo;{s.evidence}&rdquo;</p>
                            <span className="text-[10px] text-[#878D82] block">
                              Evidence Type: {s.evidenceType} · {s.strength}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Energy Observations */}
                    {analysis.energyObservations.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#878D82] uppercase tracking-wide block mb-2">
                          Energy Impact
                        </span>
                        <div className="space-y-1.5">
                          {analysis.energyObservations.map((eo, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded border text-[11px] flex items-center justify-between ${
                                eo.direction === 'energizing'
                                  ? 'bg-[#EEF4EE]/50 border-[#DCE7DC] text-[#1e3425]'
                                  : eo.direction === 'draining'
                                  ? 'bg-[#FEF2F2]/60 border-[#FCA5A5] text-[#991B1B]'
                                  : 'bg-white border-[#E6E3DE] text-[#444840]'
                              }`}
                            >
                              <span>{eo.activity}</span>
                              <span className="font-semibold capitalize">{eo.direction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reflection Question */}
                    {analysis.reflectionQuestion && (
                      <div className="p-3.5 bg-white border border-[#DCE7DC] rounded text-xs space-y-1">
                        <span className="font-semibold text-[#3E5A46] block">
                          Follow-up Reflection
                        </span>
                        <p className="italic text-[#222421]">
                          &ldquo;{analysis.reflectionQuestion}&rdquo;
                        </p>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-[#222421]">Delete Journal Entry?</h3>
            <p className="text-xs text-[#5C6059] leading-relaxed">
              This reflection and its extracted evidence will be permanently deleted. Longitudinal skills will recalibrate automatically.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-[#5C6059] hover:text-[#222421] border border-[#D5D2CC] rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEntry(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="px-3 py-1.5 text-xs text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded font-medium disabled:opacity-50"
              >
                {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
