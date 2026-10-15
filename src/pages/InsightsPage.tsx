import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  BatteryCharging,
  ZapOff,
  HelpCircle,
  RefreshCw,
  Flame,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { WeeklyReflectionReport } from '../types/index.ts';

export const InsightsPage: React.FC = () => {
  const { entries, skills, weeklyReports, refreshData, setEditingEntryId, setActiveTab } = useApp();

  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerateWeeklyReport = async () => {
    setGenerating(true);
    setReportError(null);
    try {
      await api.generateWeeklyReport();
      await refreshData();
    } catch (err: any) {
      setReportError(err.message || 'Weekly reflection report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Energy analysis aggregation
  const energizingMap: Record<string, { count: number; evidence: string }> = {};
  const drainingMap: Record<string, { count: number; evidence: string }> = {};

  for (const e of entries) {
    if (e.analysis?.energyObservations) {
      for (const eo of e.analysis.energyObservations) {
        if (eo.direction === 'energizing') {
          energizingMap[eo.activity] = {
            count: (energizingMap[eo.activity]?.count || 0) + 1,
            evidence: eo.evidence,
          };
        } else if (eo.direction === 'draining') {
          drainingMap[eo.activity] = {
            count: (drainingMap[eo.activity]?.count || 0) + 1,
            evidence: eo.evidence,
          };
        }
      }
    }
  }

  const energizingList = Object.entries(energizingMap).map(([activity, data]) => ({
    activity,
    count: data.count,
    evidence: data.evidence,
  }));

  const drainingList = Object.entries(drainingMap).map(([activity, data]) => ({
    activity,
    count: data.count,
    evidence: data.evidence,
  }));

  const latestReport = weeklyReports[0];

  // 14-day journaling heatmap matrix with click to inspect
  const past14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const str = d.toISOString().split('T')[0];
    const match = entries.find((e) => e.entryDate === str);
    return {
      date: str,
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayNumber: d.getDate(),
      entry: match,
    };
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Behavioral Insights & Reflection
          </h1>
          <p className="text-xs text-[#5C6059] mt-1">
            Synthesized longitudinal patterns of energy, rhythm, and skill momentum.
          </p>
        </div>

        <button
          onClick={handleGenerateWeeklyReport}
          disabled={generating || entries.length === 0}
          className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing Week...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Weekly Report</span>
            </>
          )}
        </button>
      </div>

      {reportError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B]">
          {reportError}
        </div>
      )}

      {/* 14-Day Journaling Consistency Grid */}
      <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#222421]">Reflection Consistency (Last 14 Days)</h2>
            <p className="text-xs text-[#878D82]">
              Regular observations give the AI high-confidence longitudinal evidence.
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-[#5C6059]">
            {entries.length} reflections recorded
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {past14Days.map((item) => (
            <div
              key={item.date}
              onClick={() => {
                if (item.entry) {
                  setEditingEntryId(item.entry.id);
                  setActiveTab('journal');
                }
              }}
              className={`p-2.5 rounded border text-center transition-all ${
                item.entry
                  ? 'bg-[#EEF4EE] border-[#3E5A46] text-[#2A4031] cursor-pointer hover:bg-[#DCE7DC]'
                  : 'bg-[#FAF8F5] border-[#E6E3DE] text-[#878D82]'
              }`}
              title={item.entry ? `${item.date}: ${item.entry.wordCount} words (click to open)` : item.date}
            >
              <span className="text-[10px] block opacity-75">{item.dayName}</span>
              <span className="text-sm font-semibold font-mono-tabular block mt-0.5">
                {item.dayNumber}
              </span>
              <span className="text-[9px] block mt-1">
                {item.entry ? `${item.entry.wordCount}w` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Weekly Reflection Report (Editorial Brief Layout) */}
      {latestReport && (
        <div className="p-6 sm:p-8 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-6">
          <div className="border-b border-[#E6E3DE] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-[#3E5A46] uppercase tracking-wide">
                Weekly Reflection Synthesis
              </span>
              <h2 className="text-xl font-semibold text-[#222421] font-editorial mt-0.5">
                Week of {latestReport.weekStart} to {latestReport.weekEnd}
              </h2>
            </div>
            <span className="text-xs text-[#878D82]">
              Generated {new Date(latestReport.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Narrative Summary */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs leading-relaxed text-[#444840]">
            <p className="font-editorial text-sm text-[#222421] italic mb-1">&ldquo;{latestReport.summary}&rdquo;</p>
          </div>

          {/* Key Demonstrations & Positive Moments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-[#222421] block">Skills Highlighted</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#3E5A46]">
                {latestReport.skillsDemonstrated.map((s, idx) => (
                  <span key={idx} className="font-medium">
                    {s}
                    {idx < latestReport.skillsDemonstrated.length - 1 && (
                      <span className="text-[#D5D2CC] ml-3">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-[#222421] block">Moments of Fulfillment</span>
              <ul className="space-y-1.5 text-[#5C6059]">
                {latestReport.positiveMoments.map((m, idx) => (
                  <li key={idx} className="pl-2 border-l border-[#3E5A46]">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recurring Patterns & Thoughtful Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F2EFEB] text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-[#222421] block">Identified Patterns</span>
              <ul className="space-y-1.5 text-[#6F746B]">
                {latestReport.recurringPatterns.map((p, idx) => (
                  <li key={idx} className="pl-2 border-l border-[#D5D2CC]">
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weekly Reflection Question */}
            <div className="p-4 bg-[#EEF4EE]/60 border border-[#DCE7DC] rounded-lg space-y-1">
              <span className="font-semibold text-[#2A4031] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#3E5A46]" />
                Question for Next Week
              </span>
              <p className="text-[#1e3425] italic leading-relaxed">
                &ldquo;{latestReport.weeklyQuestion}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Energy Matrix (Energizing vs Draining) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Energizers */}
        <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#3E5A46] font-semibold text-sm">
            <BatteryCharging className="w-5 h-5" />
            <span>High-Flow Energizers</span>
          </div>
          <p className="text-xs text-[#878D82]">
            Work scenarios that consistently leave you feeling satisfied and fulfilled.
          </p>

          {energizingList.length === 0 ? (
            <p className="text-xs text-[#878D82] italic py-4">No energizing activities tagged yet.</p>
          ) : (
            <div className="space-y-3">
              {energizingList.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#EEF4EE]/40 border border-[#DCE7DC] rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#1e3425]">
                    <span>{item.activity}</span>
                    <span className="font-mono-tabular text-[10px] text-[#52745C]">
                      {item.count} {item.count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#444840] italic line-clamp-2">&ldquo;{item.evidence}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drainers */}
        <div className="p-6 bg-white border border-[#E6E3DE] rounded-lg shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#A34E36] font-semibold text-sm">
            <ZapOff className="w-5 h-5" />
            <span>Friction & Depleters</span>
          </div>
          <p className="text-xs text-[#878D82]">
            Scenarios associated with exhaustion, circular debates, or friction.
          </p>

          {drainingList.length === 0 ? (
            <p className="text-xs text-[#878D82] italic py-4">No draining activities reported yet.</p>
          ) : (
            <div className="space-y-3">
              {drainingList.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#FEF2F2]/50 border border-[#FCA5A5] rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#991B1B]">
                    <span>{item.activity}</span>
                    <span className="font-mono-tabular text-[10px] text-[#A34E36]">
                      {item.count} {item.count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#444840] italic line-clamp-2">&ldquo;{item.evidence}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insight Confidence Methodology */}
      <div className="p-6 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs space-y-3">
        <h3 className="font-semibold text-sm text-[#222421]">How Cognitive Diary Calculates Confidence</h3>
        <p className="text-[#5C6059] leading-relaxed">
          Unlike automated personality quizzes that give pseudo-exact percentages like &ldquo;98.4% fit&rdquo;,
          Cognitive Diary uses an evidence-weighted heuristic based on:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[#444840]">
          <div className="p-3 bg-white rounded border border-[#E6E3DE]">
            <span className="font-semibold text-[#222421] block mb-1">1. Distinct Observations</span>
            <p className="text-[11px] text-[#6F746B]">
              A skill demonstrated across 4 distinct days carries substantially higher confidence than one mentioned multiple times in a single entry.
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-[#E6E3DE]">
            <span className="font-semibold text-[#222421] block mb-1">2. Explicit vs. Inferred</span>
            <p className="text-[11px] text-[#6F746B]">
              Direct statements (&ldquo;I was energized by finding the root cause&rdquo;) are weighted more heavily than inferred behavioral cues.
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-[#E6E3DE]">
            <span className="font-semibold text-[#222421] block mb-1">3. User Calibration</span>
            <p className="text-[11px] text-[#6F746B]">
              Feedback tags (&ldquo;Accurate&rdquo; / &ldquo;Inaccurate&rdquo;) calibrate and penalize false positives in future career discovery syntheses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
