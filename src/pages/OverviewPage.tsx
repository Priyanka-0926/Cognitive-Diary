import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Edit3,
  Sparkles,
  Calendar,
  Compass,
  MapPin,
  CheckCircle2,
  ArrowRight,
  BatteryCharging,
  ZapOff,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const {
    user,
    entries,
    skills,
    careers,
    roadmap,
    progressEvents,
    setActiveTab,
    setEditingEntryId,
    setSelectedSkillId,
  } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find((e) => e.entryDate === todayStr);

  // Calculate days journaled in last 7 days
  const last7DaysCount = entries.filter((e) => {
    const diff = (Date.now() - new Date(e.entryDate).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  // Calculate streak accurately
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    const sortedDates = Array.from(new Set(entries.map((e) => e.entryDate))).sort().reverse();
    let streak = 0;
    const now = new Date();
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const hasToday = sortedDates.includes(checkDate.toISOString().split('T')[0]);
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
      const hasYesterday = sortedDates.includes(checkDate.toISOString().split('T')[0]);
      if (!hasYesterday) return 0;
    }

    for (const d of sortedDates) {
      const targetStr = checkDate.toISOString().split('T')[0];
      if (d === targetStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // Roadmap metrics
  const allMilestones = roadmap ? roadmap.phases.flatMap((p) => p.milestones) : [];
  const completedMilestones = allMilestones.filter((m) => m.status === 'completed');
  const activeMilestone =
    allMilestones.find((m) => m.status === 'in_progress' || m.status === 'needs_review') ||
    allMilestones.find((m) => m.status === 'not_started');
  const roadmapProgressPct =
    allMilestones.length > 0
      ? Math.round((completedMilestones.length / allMilestones.length) * 100)
      : 0;

  // Energy patterns aggregation
  const energizingObs: Array<{ activity: string; evidence: string }> = [];
  const drainingObs: Array<{ activity: string; evidence: string }> = [];

  for (const e of entries) {
    if (e.analysis?.energyObservations) {
      for (const eo of e.analysis.energyObservations) {
        if (eo.direction === 'energizing') {
          energizingObs.push({ activity: eo.activity, evidence: eo.evidence });
        } else if (eo.direction === 'draining') {
          drainingObs.push({ activity: eo.activity, evidence: eo.evidence });
        }
      }
    }
  }

  const topSkills = skills.slice(0, 4);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Header & Greeting */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-[#878D82]">
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span>·</span>
          <span>{user?.preferences?.currentRole || 'Personal Growth Workspace'}</span>
        </div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421] tracking-tight">
          {getGreeting()}, {user?.displayName ? user.displayName.split(' ')[0] : 'friend'}. Let&apos;s reflect on your day.
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6059]">
          Small daily observations reveal patterns worth paying attention to.
        </p>
      </div>

      {/* Daily Journal Card (Warm intentional surface, single-elevation) */}
      <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#222421]">
              {todayEntry ? "Today's Reflection Complete" : "Today's Reflection"}
            </span>
            <span className="text-[#878D82] text-xs">·</span>
            <span className="text-xs text-[#52745C] font-medium">
              {todayEntry ? `${todayEntry.wordCount} words recorded` : 'Not yet captured'}
            </span>
          </div>
          <p className="text-xs text-[#5C6059] leading-relaxed">
            {todayEntry
              ? `"${todayEntry.originalText.substring(0, 140)}${todayEntry.originalText.length > 140 ? '...' : ''}"`
              : 'What did you tackle today? What felt satisfying, difficult, or surprising? Capture a few honest sentences to keep your longitudinal model calibrated.'}
          </p>
        </div>

        <div className="shrink-0">
          {todayEntry ? (
            <button
              onClick={() => {
                setEditingEntryId(todayEntry.id);
                setActiveTab('journal');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#222421] border border-[#D5D2CC] rounded hover:bg-[#FAF8F5] transition-colors"
            >
              Review Today&apos;s Entry
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingEntryId(null);
                setActiveTab('journal');
              }}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#3E5A46] hover:bg-[#2A4031] rounded transition-all shadow-xs flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write Today&apos;s Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Observation Summary Metrics Strip (Clean grid, hairline borders, no nested cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg">
          <span className="text-[11px] text-[#878D82] tracking-wide block">
            Journal Entries
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-tabular text-[#222421]">
              {entries.length}
            </span>
            <span className="text-xs text-[#878D82]">total</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg">
          <span className="text-[11px] text-[#878D82] tracking-wide block">
            Last 7 Days
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-tabular text-[#222421]">
              {last7DaysCount}
            </span>
            <span className="text-xs text-[#878D82]">/ 7 days</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg">
          <span className="text-[11px] text-[#878D82] tracking-wide block">
            Observed Strengths
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-tabular text-[#3E5A46]">
              {skills.length}
            </span>
            <span className="text-xs text-[#878D82]">skills</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg">
          <span className="text-[11px] text-[#878D82] tracking-wide block">
            Roadmap Progress
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-tabular text-[#222421]">
              {roadmapProgressPct}%
            </span>
            <span className="text-xs text-[#878D82]">milestones</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E6E3DE] rounded-lg col-span-2 lg:col-span-1">
          <span className="text-[11px] text-[#878D82] tracking-wide block">
            Reflection Streak
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-tabular text-[#222421]">
              {streak}
            </span>
            <span className="text-xs text-[#878D82]">{streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 spans): Emerging Strengths & Career Hypotheses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Emerging Strengths Section */}
          <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#222421]">Emerging Strengths</h2>
                <p className="text-xs text-[#878D82]">
                  Derived from concrete actions observed in your journal history
                </p>
              </div>
              <button
                onClick={() => setActiveTab('strengths')}
                className="text-xs text-[#3E5A46] font-medium hover:underline flex items-center gap-1"
              >
                <span>View all ({skills.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topSkills.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#878D82] space-y-2">
                <Layers className="w-6 h-6 mx-auto text-[#878D82] opacity-60" />
                <p>Your strengths will emerge as you journal over several days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topSkills.map((skill) => (
                  <div
                    key={skill.normalizedId}
                    onClick={() => {
                      setSelectedSkillId(skill.normalizedId);
                      setActiveTab('strengths');
                    }}
                    className="p-3.5 rounded border border-[#E6E3DE] hover:border-[#D5D2CC] hover:bg-[#FAF8F5] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#222421] group-hover:text-[#3E5A46] transition-colors">
                        {skill.name}
                      </span>
                      <div className="flex items-center gap-2 text-[#878D82] text-[11px]">
                        <span>{skill.category}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">
                          {skill.frequency} {skill.frequency === 1 ? 'observation' : 'observations'}
                        </span>
                      </div>
                    </div>

                    {skill.evidenceExcerpts[0] && (
                      <p className="text-[11px] text-[#6F746B] italic line-clamp-1 mt-1">
                        &ldquo;{skill.evidenceExcerpts[0].excerpt}&rdquo;
                      </p>
                    )}

                    <div className="w-full bg-[#EAE8E3] h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="bg-[#3E5A46] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round(skill.averageConfidence * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Career Hypotheses Exploration Section */}
          <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#222421]">Career Hypotheses</h2>
                <p className="text-xs text-[#878D82]">
                  Plausible pathways synthesized from what energizes you
                </p>
              </div>
              <button
                onClick={() => setActiveTab('careers')}
                className="text-xs text-[#3E5A46] font-medium hover:underline flex items-center gap-1"
              >
                <span>Explore discovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {careers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#878D82] space-y-3">
                <Compass className="w-6 h-6 mx-auto text-[#878D82] opacity-60" />
                <p>Gathering evidence. Write a few more reflections to synthesize career hypotheses.</p>
                <button
                  onClick={() => setActiveTab('careers')}
                  className="px-3 py-1.5 text-xs text-[#3E5A46] border border-[#3E5A46] rounded hover:bg-[#EEF4EE]"
                >
                  Open Discovery Engine
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {careers.slice(0, 2).map((career) => (
                  <div
                    key={career.id}
                    className="p-4 border border-[#E6E3DE] rounded hover:border-[#D5D2CC] transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#222421]">
                        {career.title}
                      </h3>
                      <span className="text-[11px] text-[#52745C] font-medium shrink-0">
                        {career.evidenceStrength === 'supported_by_repeated_observations'
                          ? 'Well Supported'
                          : 'Promising Match'}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C6059] leading-relaxed line-clamp-2">
                      {career.whyItMayFit}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-[#F2EFEB]">
                      <span className="text-[11px] text-[#878D82]">
                        {career.relevantStrengths.slice(0, 2).join(' · ')}
                      </span>
                      <button
                        onClick={() => setActiveTab('careers')}
                        className="text-xs text-[#3E5A46] font-medium hover:underline flex items-center gap-1"
                      >
                        <span>Inspect fit rationale</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Roadmap Tracker & Energy Patterns (1 span) */}
        <div className="space-y-8">
          {/* Active Roadmap Overview */}
          <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#222421]">Active Roadmap</h2>
              <button
                onClick={() => setActiveTab('roadmap')}
                className="text-xs text-[#3E5A46] font-medium hover:underline"
              >
                View track
              </button>
            </div>

            {roadmap ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[#878D82] block">Current Direction</span>
                  <span className="text-sm font-semibold text-[#222421]">
                    {roadmap.careerTitle}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#6F746B]">
                    <span>Completion Ratio</span>
                    <span className="font-mono-tabular font-medium text-[#222421]">
                      {roadmapProgressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE8E3] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3E5A46] h-full rounded-full transition-all duration-500"
                      style={{ width: `${roadmapProgressPct}%` }}
                    />
                  </div>
                </div>

                {activeMilestone && (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-1">
                    <span className="text-[10px] text-[#878D82] uppercase tracking-wide block">
                      Active Milestone
                    </span>
                    <p className="font-semibold text-[#222421]">{activeMilestone.title}</p>
                    <p className="text-[11px] text-[#6F746B] line-clamp-2">
                      {activeMilestone.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#878D82] space-y-2">
                <p>No active roadmap selected.</p>
                <button
                  onClick={() => setActiveTab('careers')}
                  className="px-3 py-1.5 text-xs text-[#3E5A46] border border-[#3E5A46] rounded hover:bg-[#EEF4EE]"
                >
                  Choose a Career Track
                </button>
              </div>
            )}
          </div>

          {/* Energy Patterns Overview */}
          <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#222421]">Observed Energy Flow</h2>
              <p className="text-xs text-[#878D82]">
                What energizes your focus versus what drains you
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[#3E5A46] font-semibold mb-2">
                  <BatteryCharging className="w-4 h-4" />
                  <span>Sustained Energizers</span>
                </div>
                {energizingObs.length === 0 ? (
                  <p className="text-[#878D82] text-[11px] italic">No energizing activities tagged yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {energizingObs.slice(0, 3).map((item, idx) => (
                      <li
                        key={idx}
                        className="text-[#444840] text-[11px] leading-relaxed pl-2 border-l-2 border-[#3E5A46]"
                      >
                        {item.activity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2 border-t border-[#F2EFEB]">
                <div className="flex items-center gap-1.5 text-[#A34E36] font-semibold mb-2">
                  <ZapOff className="w-4 h-4" />
                  <span>Friction & Drainers</span>
                </div>
                {drainingObs.length === 0 ? (
                  <p className="text-[#878D82] text-[11px] italic">No draining activities reported yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {drainingObs.slice(0, 2).map((item, idx) => (
                      <li
                        key={idx}
                        className="text-[#444840] text-[11px] leading-relaxed pl-2 border-l-2 border-[#A34E36]"
                      >
                        {item.activity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Recent Verified Evidence Events */}
          {progressEvents.length > 0 && (
            <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 space-y-3">
              <h2 className="text-base font-semibold text-[#222421]">Recent Progress Detections</h2>
              <div className="space-y-2">
                {progressEvents.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#878D82]">
                      <span className="font-semibold text-[#222421]">{ev.milestoneTitle}</span>
                      <span className="font-mono-tabular">{ev.journalEntryDate}</span>
                    </div>
                    <p className="text-[11px] text-[#5C6059] italic line-clamp-2">
                      &ldquo;{ev.evidenceExcerpt}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
