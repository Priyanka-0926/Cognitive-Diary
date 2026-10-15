import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  MapPin,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { Milestone, MilestoneStatus, ProgressEvent } from '../types/index.ts';

export const CareerRoadmapPage: React.FC = () => {
  const { roadmap, progressEvents, refreshData, setEditingEntryId, setActiveTab } = useApp();

  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingEvents = progressEvents.filter((e) => e.userConfirmationStatus === 'pending');

  const handleConfirmProgress = async (event: ProgressEvent) => {
    setConfirmingEventId(event.id);
    setActionError(null);
    try {
      await api.confirmProgressEvent(event.id);
      await refreshData();
    } catch (err: any) {
      setActionError(`Could not confirm progress: ${err.message}`);
    } finally {
      setConfirmingEventId(null);
    }
  };

  const handleRejectProgress = async (event: ProgressEvent) => {
    setConfirmingEventId(event.id);
    setActionError(null);
    try {
      await api.rejectProgressEvent(event.id);
      await refreshData();
    } catch (err: any) {
      setActionError(`Could not reject progress: ${err.message}`);
    } finally {
      setConfirmingEventId(null);
    }
  };

  const handleStatusChange = async (roadmapId: string, milestoneId: string, newStatus: MilestoneStatus) => {
    setUpdatingMilestoneId(milestoneId);
    setActionError(null);
    try {
      await api.updateMilestoneStatus(roadmapId, milestoneId, newStatus);
      await refreshData();
    } catch (err: any) {
      setActionError(`Could not update milestone: ${err.message}`);
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  // Metrics
  const allMilestones = roadmap ? roadmap.phases.flatMap((p) => p.milestones) : [];
  const completedCount = allMilestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = allMilestones.filter((m) => m.status === 'in_progress' || m.status === 'needs_review').length;
  const progressPct = allMilestones.length > 0 ? Math.round((completedCount / allMilestones.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {actionError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[#991B1B] hover:text-[#7F1D1D] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Career Roadmap
          </h1>
          <p className="text-xs text-[#5C6059] mt-1">
            Phased learning track with automated milestone verification from your journal entries.
          </p>
        </div>

        {roadmap && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#878D82] font-mono-tabular">
              {roadmap.weeklyTimeBudget} hrs / week budget
            </span>
          </div>
        )}
      </div>

      {!roadmap ? (
        <div className="p-12 text-center bg-white border border-[#E6E3DE] rounded-lg space-y-4">
          <MapPin className="w-10 h-10 text-[#878D82] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#222421]">No Active Roadmap Selected</h3>
            <p className="text-xs text-[#5C6059] max-w-md mx-auto">
              Explore your synthesized career hypotheses and adopt one as your active learning roadmap.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('careers')}
            className="px-4 py-2 bg-[#3E5A46] text-white text-xs font-semibold rounded hover:bg-[#2A4031] transition-colors"
          >
            Explore Career Tracks
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Roadmap Banner & Progress Bar */}
          <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#3E5A46] uppercase tracking-wide">
                  Active Career Roadmap
                </span>
                <h2 className="text-xl font-semibold text-[#222421] font-editorial mt-0.5">
                  {roadmap.careerTitle}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono-tabular text-[#5C6059]">
                <span>{completedCount} completed</span>
                <span>·</span>
                <span>{inProgressCount} in progress</span>
                <span>·</span>
                <span className="font-semibold text-[#222421]">{progressPct}% total</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#EAE8E3] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#3E5A46] h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Pending AI Milestone Confirmations (Automated Accountability Engine) */}
          {pendingEvents.length > 0 && (
            <div className="p-5 bg-[#EEF4EE]/60 border border-[#DCE7DC] rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2A4031]">
                <Sparkles className="w-4 h-4 text-[#3E5A46]" />
                <span>AI Progress Detections Awaiting Your Confirmation</span>
              </div>
              <p className="text-xs text-[#444840]">
                Cognitive Diary observed evidence in your recent journal entries that may fulfill the completion criteria for the following milestones.
              </p>

              <div className="space-y-3 pt-1">
                {pendingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-white border border-[#DCE7DC] rounded-md shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#878D82]">
                      <span className="font-semibold text-[#222421] text-xs">
                        Milestone: {event.milestoneTitle}
                      </span>
                      <span>Journaled on {event.journalEntryDate}</span>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px] italic text-[#444840] leading-relaxed">
                      &ldquo;{event.evidenceExcerpt}&rdquo;
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEntryId(event.journalEntryId);
                            setActiveTab('journal');
                          }}
                          className="text-[11px] text-[#3E5A46] hover:underline"
                        >
                          View source journal entry →
                        </button>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleRejectProgress(event)}
                          disabled={confirmingEventId === event.id}
                          className="px-3 py-1.5 text-xs text-[#5C6059] hover:text-[#222421] border border-[#D5D2CC] rounded hover:bg-[#FAF8F5]"
                        >
                          Not yet completed
                        </button>
                        <button
                          onClick={() => handleConfirmProgress(event)}
                          disabled={confirmingEventId === event.id}
                          className="px-4 py-1.5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Milestone Complete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phased Roadmap Breakdown */}
          <div className="space-y-8">
            {roadmap.phases.map((phase, pIdx) => (
              <div key={phase.id} className="bg-white border border-[#E6E3DE] rounded-lg shadow-xs overflow-hidden">
                {/* Phase Header */}
                <div className="p-5 bg-[#FAF8F5] border-b border-[#E6E3DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-[#222421]">
                      {phase.name}
                    </h3>
                    <p className="text-xs text-[#5C6059] mt-0.5">{phase.description}</p>
                  </div>
                  <span className="text-xs text-[#878D82] font-mono-tabular shrink-0">
                    {phase.milestones.filter((m) => m.status === 'completed').length} / {phase.milestones.length} done
                  </span>
                </div>

                {/* Milestones inside Phase */}
                <div className="divide-y divide-[#F2EFEB]">
                  {phase.milestones.map((m) => {
                    const isCompleted = m.status === 'completed';
                    const isReview = m.status === 'needs_review';
                    const isInProgress = m.status === 'in_progress';

                    return (
                      <div key={m.id} className="p-6 space-y-4 hover:bg-[#FCFBF9] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    roadmap.id,
                                    m.id,
                                    isCompleted ? 'in_progress' : 'completed'
                                  )
                                }
                                disabled={updatingMilestoneId === m.id}
                                className="text-[#3E5A46] hover:opacity-80 transition-opacity"
                                title={isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#3E5A46] fill-[#EEF4EE]" />
                                ) : (
                                  <Circle className="w-5 h-5 text-[#878D82]" />
                                )}
                              </button>
                              <h4
                                className={`text-sm font-semibold ${
                                  isCompleted ? 'text-[#878D82] line-through' : 'text-[#222421]'
                                }`}
                              >
                                {m.title}
                              </h4>
                            </div>
                            <p className="text-xs text-[#5C6059] pl-7 leading-relaxed">
                              {m.description}
                            </p>
                          </div>

                          {/* Status Pill & Duration */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-[#878D82] font-mono-tabular hidden sm:inline">
                              {m.estimatedDuration}
                            </span>
                            <select
                              value={m.status}
                              disabled={updatingMilestoneId === m.id}
                              onChange={(e) =>
                                handleStatusChange(roadmap.id, m.id, e.target.value as MilestoneStatus)
                              }
                              className={`text-xs px-2.5 py-1 rounded border font-medium bg-white focus:outline-none focus:ring-1 focus:ring-[#3E5A46] ${
                                isCompleted
                                  ? 'border-[#DCE7DC] text-[#2A4031] bg-[#EEF4EE]'
                                  : isReview
                                  ? 'border-[#FDE68A] text-[#92400E] bg-[#FFFBEB]'
                                  : isInProgress
                                  ? 'border-[#3E5A46] text-[#3E5A46]'
                                  : 'border-[#D5D2CC] text-[#5C6059]'
                              }`}
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="needs_review">Needs Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        {/* Completion Criteria & Skills */}
                        <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded space-y-1">
                            <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block">
                              Observable Completion Criteria
                            </span>
                            <p className="text-[#444840] leading-relaxed">
                              {m.completionCriteria}
                            </p>
                          </div>

                          <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded space-y-1">
                            <span className="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block">
                              Target Capabilities
                            </span>
                            <p className="text-[#3E5A46] font-medium">
                              {m.skillsTargeted.join(' · ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Events Audit Trail */}
          <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#222421]">
              Automated Progress Audit Trail
            </h3>
            <p className="text-xs text-[#5C6059]">
              Every roadmap milestone state is anchored in verified evidence from your journal history.
            </p>

            {progressEvents.length === 0 ? (
              <p className="text-xs text-[#878D82] italic py-3">No progress events recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {progressEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#222421]">{ev.milestoneTitle}</span>
                      <p className="italic text-[#6F746B] text-[11px] mt-0.5 line-clamp-1">
                        &ldquo;{ev.evidenceExcerpt}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#878D82]">
                      <span className="font-mono-tabular">{ev.journalEntryDate}</span>
                      <span
                        className={`capitalize font-medium ${
                          ev.userConfirmationStatus === 'confirmed'
                            ? 'text-[#3E5A46]'
                            : ev.userConfirmationStatus === 'pending'
                            ? 'text-[#B45309]'
                            : 'text-[#878D82]'
                        }`}
                      >
                        {ev.userConfirmationStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
