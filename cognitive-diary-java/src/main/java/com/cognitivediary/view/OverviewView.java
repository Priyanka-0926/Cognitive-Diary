package com.cognitivediary.view;

import com.cognitivediary.model.Models.*;

import java.util.List;

public class OverviewView {

    public static String render(User user, List<JournalEntry> entries, Roadmap roadmap) {
        StringBuilder recentEntriesHtml = new StringBuilder();
        if (entries == null || entries.isEmpty()) {
            recentEntriesHtml.append("""
                <div class="p-8 text-center bg-white border border-[#E6E3DE] rounded-lg">
                    <p class="text-xs text-[#5C6059]">No reflections recorded yet. Write your first work reflection to discover your strengths.</p>
                </div>
                """);
        } else {
            for (JournalEntry e : entries.stream().limit(3).toList()) {
                String statusPill = "completed".equalsIgnoreCase(e.analysisStatus())
                        ? "<span class=\"px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4EE] text-[#3E5A46]\">completed</span>"
                        : "<span class=\"px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#B45309]\">" + e.analysisStatus() + "</span>";

                String summaryHtml = (e.analysis() != null && e.analysis().summary() != null)
                        ? "<div class=\"pt-2 border-t border-[#F2EFEB] text-xs text-[#5C6059]\"><span class=\"font-semibold text-[#222421]\">Synthesis: </span>" + UiComponents.escape(e.analysis().summary()) + "</div>"
                        : "";

                recentEntriesHtml.append("""
                    <div class="bg-white p-5 rounded-lg border border-[#E6E3DE] space-y-3">
                        <div class="flex items-center justify-between text-xs text-[#878D82]">
                            <span class="font-mono-tabular font-medium text-[#222421]">%s</span>
                            %s
                        </div>
                        <p class="text-sm text-[#444840] line-clamp-3 leading-relaxed">%s</p>
                        %s
                    </div>
                    """.formatted(
                        UiComponents.escape(e.entryDate()),
                        statusPill,
                        UiComponents.escape(e.originalText()),
                        summaryHtml
                ));
            }
        }

        String displayName = (user != null && user.displayName() != null) ? user.displayName() : "Elena";
        int entryCount = entries != null ? entries.size() : 0;

        String body = """
            <div class="space-y-8">
                <!-- Welcome Hero -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
                    <div class="space-y-2">
                        <span class="text-xs font-semibold text-[#878D82] uppercase tracking-wider">Personal Growth Dashboard</span>
                        <h1 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
                            Welcome back, %s.
                        </h1>
                        <p class="text-sm text-[#5C6059] max-w-xl">
                            Everyday reflections reveal your organic cognitive strengths and energizing work patterns.
                        </p>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <a href="/journal" class="px-4 py-2.5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-medium rounded transition-colors shadow-xs">
                            Start Today's Reflection
                        </a>
                    </div>
                </div>

                <!-- Metrics Strip -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white p-5 rounded-lg border border-[#E6E3DE]">
                        <span class="text-xs text-[#878D82] block font-medium">Reflections Recorded</span>
                        <span class="font-editorial text-3xl font-semibold text-[#222421] mt-1 block">%d</span>
                    </div>
                    <div class="bg-white p-5 rounded-lg border border-[#E6E3DE]">
                        <span class="text-xs text-[#878D82] block font-medium">Active Milestones</span>
                        <span class="font-editorial text-3xl font-semibold text-[#3E5A46] mt-1 block">3</span>
                    </div>
                    <div class="bg-white p-5 rounded-lg border border-[#E6E3DE]">
                        <span class="text-xs text-[#878D82] block font-medium">Extracted Strengths</span>
                        <span class="font-editorial text-3xl font-semibold text-[#222421] mt-1 block">8</span>
                    </div>
                    <div class="bg-white p-5 rounded-lg border border-[#E6E3DE]">
                        <span class="text-xs text-[#878D82] block font-medium">Energy Balance</span>
                        <span class="font-editorial text-3xl font-semibold text-[#2A4031] mt-1 block">+82%%</span>
                    </div>
                </div>

                <!-- Two Column Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Recent Reflections -->
                    <div class="lg:col-span-2 space-y-4">
                        <div class="flex items-center justify-between pb-2 border-b border-[#E6E3DE]">
                            <h2 class="font-editorial text-xl font-semibold text-[#222421]">Recent Reflections</h2>
                            <a href="/archive" class="text-xs text-[#3E5A46] font-medium hover:underline">View All &rarr;</a>
                        </div>
                        <div class="space-y-4">
                            %s
                        </div>
                    </div>

                    <!-- Side Cards -->
                    <div class="space-y-6">
                        <!-- Dominant Strengths Card -->
                        <div class="bg-white p-6 rounded-lg border border-[#E6E3DE] space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="font-editorial text-lg font-semibold text-[#222421]">Dominant Strengths</h3>
                                <a href="/strengths" class="text-xs text-[#3E5A46] hover:underline">Explore</a>
                            </div>
                            <div class="space-y-2">
                                <div class="p-3 bg-[#FAF8F5] rounded border border-[#E6E3DE] flex items-center justify-between">
                                    <span class="text-xs font-semibold text-[#222421]">Distributed Systems Architecture</span>
                                    <span class="text-[11px] font-mono-tabular text-[#3E5A46] font-bold">94%%</span>
                                </div>
                                <div class="p-3 bg-[#FAF8F5] rounded border border-[#E6E3DE] flex items-center justify-between">
                                    <span class="text-xs font-semibold text-[#222421]">Cross-functional Mentorship</span>
                                    <span class="text-[11px] font-mono-tabular text-[#3E5A46] font-bold">88%%</span>
                                </div>
                                <div class="p-3 bg-[#FAF8F5] rounded border border-[#E6E3DE] flex items-center justify-between">
                                    <span class="text-xs font-semibold text-[#222421]">Incident Root-Cause Diagnostics</span>
                                    <span class="text-[11px] font-mono-tabular text-[#3E5A46] font-bold">85%%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Career Roadmaps Card -->
                        <div class="bg-white p-6 rounded-lg border border-[#E6E3DE] space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="font-editorial text-lg font-semibold text-[#222421]">Current Career Focus</h3>
                                <a href="/roadmap" class="text-xs text-[#3E5A46] hover:underline">View Roadmap</a>
                            </div>
                            <div class="p-4 bg-[#EEF4EE]/40 border border-[#DCE7DC] rounded-lg space-y-2">
                                <span class="text-[11px] font-semibold text-[#3E5A46] uppercase tracking-wide">Target Role</span>
                                <h4 class="font-semibold text-sm text-[#222421]">Staff Systems Architect</h4>
                                <p class="text-xs text-[#5C6059] leading-relaxed">
                                    Focusing on latency profiling, high-concurrency storage bottlenecks, and cross-team design review governance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            """.formatted(
                UiComponents.escape(displayName),
                entryCount,
                recentEntriesHtml.toString()
        );

        return UiComponents.wrapPage("Personal Growth Overview", "overview", user, body);
    }
}
