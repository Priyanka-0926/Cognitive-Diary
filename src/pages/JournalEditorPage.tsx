import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Mic,
  MicOff,
  Save,
  Trash2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  ArrowLeft,
  Lightbulb,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { JournalEntry } from '../types/index.ts';

const PROMPT_SUGGESTIONS = [
  'What felt unexpectedly satisfying to solve or build today?',
  'What activity drained your momentum or caused circular debate?',
  'Did you explain or translate a concept to someone else?',
  'What technical trade-off did you have to weigh today?',
  'What took longer than expected, and what was the root cause?',
];

export const JournalEditorPage: React.FC = () => {
  const {
    entries,
    editingEntryId,
    setEditingEntryId,
    setActiveTab,
    refreshData,
    geminiConfigured,
  } = useApp();

  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [text, setText] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'analyzing' | 'completed' | 'error'>('idle');
  const [activeAnalysis, setActiveAnalysis] = useState<JournalEntry['analysis'] | undefined>(undefined);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationSupported, setDictationSupported] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing entry if editing
  useEffect(() => {
    if (editingEntryId) {
      const entry = entries.find((e) => e.id === editingEntryId);
      if (entry) {
        setEntryDate(entry.entryDate);
        setText(entry.originalText);
        setActiveAnalysis(entry.analysis);
        if (entry.analysisStatus === 'completed') {
          setSaveStatus('completed');
        } else if (entry.analysisStatus === 'needs_retry') {
          setSaveStatus('error');
          setAnalysisError(entry.analysisError || 'AI analysis needs retry');
        }
        setHasUnsavedChanges(false);
        return;
      }
    }

    // New entry: check local draft
    const draft = sessionStorage.getItem('cognitive_diary_draft');
    if (draft && !editingEntryId) {
      setText(draft);
    } else if (!editingEntryId) {
      setText('');
      setActiveAnalysis(undefined);
      setSaveStatus('idle');
    }
    setHasUnsavedChanges(false);
  }, [editingEntryId, entries]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDictationSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setText((prev) => {
          const updated = prev ? `${prev.trim()} ${final.trim()}` : final.trim();
          setHasUnsavedChanges(true);
          sessionStorage.setItem('cognitive_diary_draft', updated);
          return updated;
        });
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleDictation = () => {
    if (!dictationSupported) return;
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsDictating(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setHasUnsavedChanges(true);
    if (!editingEntryId) {
      sessionStorage.setItem('cognitive_diary_draft', e.target.value);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setSaveStatus('analyzing');
    setAnalysisError(null);

    try {
      let saved: JournalEntry;
      if (editingEntryId) {
        saved = await api.updateJournalEntry(editingEntryId, text.trim(), entryDate);
      } else {
        saved = await api.createJournalEntry(text.trim(), entryDate);
        sessionStorage.removeItem('cognitive_diary_draft');
        setEditingEntryId(saved.id);
      }

      setHasUnsavedChanges(false);
      setActiveAnalysis(saved.analysis);

      if (saved.analysisStatus === 'completed') {
        setSaveStatus('completed');
      } else if (saved.analysisStatus === 'needs_retry') {
        setSaveStatus('error');
        setAnalysisError(saved.analysisError || 'AI analysis could not complete.');
      } else {
        setSaveStatus('saved');
      }

      await refreshData();
    } catch (err: any) {
      setSaveStatus('error');
      setAnalysisError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleRetryAnalysis = async () => {
    if (!editingEntryId) return;
    setSaving(true);
    setSaveStatus('analyzing');
    setAnalysisError(null);

    try {
      const res = await api.retryAnalysis(editingEntryId);
      setActiveAnalysis(res.analysis);
      setSaveStatus('completed');
      await refreshData();
    } catch (err: any) {
      setSaveStatus('error');
      setAnalysisError(err.message || 'Retry failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEntryId) return;
    try {
      await api.deleteJournalEntry(editingEntryId);
      setEditingEntryId(null);
      setText('');
      setActiveAnalysis(undefined);
      setShowDeleteConfirm(false);
      await refreshData();
      setActiveTab('history');
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to delete entry');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className={`space-y-8 animate-fadeIn ${focusMode ? 'max-w-3xl' : 'max-w-4xl'} mx-auto transition-all`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {editingEntryId && (
              <button
                onClick={() => {
                  setEditingEntryId(null);
                  setText('');
                  setActiveAnalysis(undefined);
                  setSaveStatus('idle');
                }}
                className="text-xs text-[#5C6059] hover:text-[#222421] flex items-center gap-1 mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>New Entry</span>
              </button>
            )}
            <h1 className="font-editorial text-2xl font-semibold text-[#222421]">
              {editingEntryId ? 'Review & Calibrate Reflection' : 'Tell me about your day.'}
            </h1>
          </div>
          <p className="text-xs text-[#5C6059]">
            No perfect answers. No categories. Just describe what happened in your own words.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#5C6059]">
            <Calendar className="w-3.5 h-3.5 text-[#878D82]" />
            <input
              type="date"
              value={entryDate}
              onChange={(e) => {
                setEntryDate(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="px-2 py-1 bg-white border border-[#D5D2CC] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-2 text-[#878D82] hover:text-[#222421] rounded transition-colors hidden sm:inline"
              title={focusMode ? 'Exit Focus View' : 'Distraction-Free Focus View'}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {editingEntryId && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-[#878D82] hover:text-[#B91C1C] rounded transition-colors"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingEntryId ? 'Update & Reanalyze' : 'Save Entry'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gentle Thought Starter Prompt Strip */}
      {!editingEntryId && (
        <div className="p-3.5 bg-white border border-[#E6E3DE] rounded-lg text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-[#5C6059]">
            <Lightbulb className="w-4 h-4 text-[#3E5A46] shrink-0" />
            <span className="font-medium text-[#222421]">Reflection spark:</span>
            <span className="italic text-[#6F746B]">{PROMPT_SUGGESTIONS[selectedPromptIdx]}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setSelectedPromptIdx((prev) => (prev + 1) % PROMPT_SUGGESTIONS.length)
            }
            className="text-[11px] text-[#3E5A46] font-medium hover:underline shrink-0"
          >
            Another spark →
          </button>
        </div>
      )}

      {/* Editor Surface */}
      <div className="bg-white border border-[#E6E3DE] rounded-lg shadow-xs overflow-hidden">
        {/* Editor Toolbar */}
        <div className="px-5 py-2.5 bg-[#FAF8F5] border-b border-[#E6E3DE] flex items-center justify-between text-xs text-[#878D82]">
          <div className="flex items-center gap-4">
            <span className="font-mono-tabular">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars · ~{readTimeMinutes} min read
            </span>
            {hasUnsavedChanges && (
              <span className="text-[#B45309] font-medium text-[11px]">Unsaved edits</span>
            )}
            {!hasUnsavedChanges && saveStatus === 'completed' && (
              <span className="text-[#3E5A46] font-medium text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Analyzed
              </span>
            )}
          </div>

          {/* Voice Dictation Button */}
          {dictationSupported && (
            <button
              type="button"
              onClick={toggleDictation}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-xs ${
                isDictating
                  ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                  : 'bg-white border border-[#D5D2CC] text-[#5C6059] hover:text-[#222421]'
              }`}
              title={isDictating ? 'Stop Voice Dictation' : 'Start Speech Dictation'}
            >
              {isDictating ? (
                <>
                  <MicOff className="w-3.5 h-3.5 animate-pulse" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Dictation</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Multiline Writing Area */}
        <div className="p-6 sm:p-8">
          <textarea
            ref={textareaRef}
            rows={12}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="What did you work on today? What felt satisfying, difficult, surprising, or frustrating? Write naturally, as if you were talking to yourself."
            className="w-full text-base sm:text-lg leading-relaxed text-[#222421] placeholder-[#A8A49C] border-none focus:outline-none resize-y bg-transparent font-sans"
          />
        </div>

        {/* Bottom Helper Bar */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#E6E3DE] flex items-center justify-between text-xs text-[#878D82]">
          <span className="text-[11px]">
            Press <kbd className="font-mono bg-white px-1.5 py-0.5 border border-[#D5D2CC] rounded">⌘ + Enter</kbd> to save.
          </span>
          <span className="text-[11px]">Private & isolated to your account</span>
        </div>
      </div>

      {/* AI Analysis Loading State */}
      {saveStatus === 'analyzing' && (
        <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3E5A46]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Invisible Extraction Engine is analyzing your entry...</span>
          </div>
          <p className="text-xs text-[#6F746B]">
            Extracting concrete evidence of demonstrated skills, energy patterns, and work style without guessing your personality.
          </p>
        </div>
      )}

      {/* Error / Retry Banner */}
      {saveStatus === 'error' && (
        <div className="p-5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#991B1B]">
              <AlertCircle className="w-4 h-4" />
              <span>AI Analysis Pending</span>
            </div>
            {editingEntryId && (
              <button
                onClick={handleRetryAnalysis}
                className="px-3 py-1 bg-white border border-[#F87171] text-xs font-medium text-[#991B1B] rounded hover:bg-[#FEF2F2]"
              >
                Retry Analysis
              </button>
            )}
          </div>
          <p className="text-xs text-[#7F1D1D] leading-relaxed">
            Your journal text has been safely saved. {analysisError || 'AI extraction could not complete.'}
            {!geminiConfigured && (
              <span className="block mt-1">
                Note: In AI Studio, ensure GEMINI_API_KEY is configured in Secrets to enable live Gemini analysis.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Structured Analysis Results View (Clean editorial layout) */}
      {activeAnalysis && (
        <div className="bg-white border border-[#E6E3DE] rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E3DE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3E5A46]" />
              <h2 className="text-sm font-semibold text-[#222421]">Observed Evidence Summary</h2>
            </div>
            <span className="text-[11px] text-[#878D82]">
              Extracted via {activeAnalysis.modelUsed}
            </span>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* One-Sentence Summary */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
              <span className="text-[11px] font-semibold text-[#878D82] uppercase tracking-wide block mb-1">
                Objective Event Summary
              </span>
              <p className="text-[#222421] text-xs leading-relaxed">{activeAnalysis.summary}</p>
            </div>

            {/* Demonstrated Skills with Unboxed Metadata */}
            <div>
              <span className="font-semibold text-xs text-[#222421] block mb-2.5">
                Demonstrated Capabilities ({activeAnalysis.skills.length})
              </span>
              {activeAnalysis.skills.length === 0 ? (
                <p className="text-[#878D82] italic">No specific skills clearly exhibited in this entry.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAnalysis.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-[#E6E3DE] rounded bg-white space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#222421]">{skill.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#878D82]">
                          <span>{skill.category}</span>
                          <span>·</span>
                          <span className="capitalize">{skill.strength}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#6F746B] italic">
                        &ldquo;{skill.evidence}&rdquo;
                      </p>
                      <div className="text-[10px] text-[#878D82] flex justify-between pt-1 border-t border-[#F2EFEB]">
                        <span>Evidence: {skill.evidenceType}</span>
                        <span className="font-mono-tabular">
                          Confidence: {Math.round(skill.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Energy & Work Style Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#F2EFEB]">
              {/* Energy Observations */}
              <div>
                <span className="font-semibold text-xs text-[#222421] block mb-2">
                  Energy Direction
                </span>
                {activeAnalysis.energyObservations.length === 0 ? (
                  <p className="text-[#878D82] italic text-[11px]">No explicit energy peaks reported.</p>
                ) : (
                  <div className="space-y-2">
                    {activeAnalysis.energyObservations.map((eo, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded border text-[11px] ${
                          eo.direction === 'energizing'
                            ? 'bg-[#EEF4EE]/40 border-[#DCE7DC] text-[#1e3425]'
                            : eo.direction === 'draining'
                            ? 'bg-[#FEF2F2]/50 border-[#FCA5A5] text-[#991B1B]'
                            : 'bg-[#FAF8F5] border-[#E6E3DE] text-[#444840]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>{eo.activity}</span>
                          <span className="capitalize font-semibold">{eo.direction}</span>
                        </div>
                        <p className="italic mt-1 text-[10px] opacity-80">&ldquo;{eo.evidence}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work-Style Observations */}
              <div>
                <span className="font-semibold text-xs text-[#222421] block mb-2">
                  Work Style Patterns
                </span>
                {activeAnalysis.workStyleObservations.length === 0 ? (
                  <p className="text-[#878D82] italic text-[11px]">No specific work styles inferred.</p>
                ) : (
                  <div className="space-y-2">
                    {activeAnalysis.workStyleObservations.map((wo, idx) => (
                      <div key={idx} className="p-2.5 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px]">
                        <span className="font-medium text-[#222421] block">{wo.pattern}</span>
                        <p className="italic text-[#6F746B] text-[10px] mt-1">&ldquo;{wo.evidence}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reflection Question */}
            {activeAnalysis.reflectionQuestion && (
              <div className="p-4 bg-[#EEF4EE]/60 border border-[#DCE7DC] rounded-lg text-xs space-y-1">
                <span className="font-semibold text-[#2A4031] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#3E5A46]" />
                  Follow-Up Reflection Prompt
                </span>
                <p className="text-[#1e3425] leading-relaxed italic">
                  &ldquo;{activeAnalysis.reflectionQuestion}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#222421]">Delete Journal Entry?</h3>
            <p className="text-xs text-[#5C6059] leading-relaxed">
              This will permanently delete this journal entry, its extracted evidence, and unlink any associated progress detections.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#5C6059] hover:text-[#222421]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold rounded"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
