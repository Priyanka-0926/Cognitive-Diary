package com.cognitivediary.view;

import com.cognitivediary.model.Models.Milestone;
import com.cognitivediary.model.Models.Roadmap;
import com.cognitivediary.model.Models.RoadmapPhase;
import com.cognitivediary.model.Models.User;

public class RoadmapView {

    public static String render(User user, Roadmap roadmap) {
        StringBuilder phasesHtml = new StringBuilder();

        if (roadmap != null && roadmap.phases() != null) {
            for (RoadmapPhase phase : roadmap.phases()) {
                StringBuilder milestonesHtml = new StringBuilder();
                if (phase.milestones() != null) {
                    for (Milestone m : phase.milestones()) {
                        String isCompleted = "completed".equalsIgnoreCase(m.status());
                        String icon = isCompleted
                                ? "<span class=\"w-4 h-4 rounded-full bg-[#3E5A46] text-white text-[10px] flex items-center justify-center font-bold\">✓</span>"
                                : "<span class=\"w-4 h-4 rounded-full border border-[#D5D2CC] text-[10px] flex items-center justify-center text-[#878D82]\">·</span>";

                        String bgClass = isCompleted ? "bg-[#EEF4EE]/50 border-[#DCE7DC]" : "bg-white border-[#E6E3DE]";
                        String statusColor = isCompleted ? "text-[#3E5A46]" : "text-[#B45309]";

                        milestonesHtml.append("""
                            <div class="p-4 %s border rounded-lg flex items-start justify-between gap-4">
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2">
                                        %s
                                        <h4 class="text-sm font-semibold text-[#222421]">%s</h4>
                                    </div>
                                    <p class="text-xs text-[#5C6059]">%s</p>
                                </div>
                                <span class="text-[11px] font-semibold %s capitalize shrink-0">%s</span>
                            </div>
                            """.formatted(
                                bgClass,
                                icon,
                                UiComponents.escape(m.title()),
                                UiComponents.escape(m.description()),
                                statusColor,
                                UiComponents.escape(m.status().replace("_", " "))
                        ));
                    }
                }

                phasesHtml.append("""
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-[#E6E3DE]">
                            <h2 class="font-editorial text-lg font-semibold text-[#222421]">%s</h2>
                            <span class="text-xs text-[#3E5A46] font-medium">%s</span>
                        </div>
                        <div class="space-y-3">
                            %s
                        </div>
                    </div>
                    """.formatted(
                        UiComponents.escape(phase.name()),
                        UiComponents.escape(phase.description()),
                        milestonesHtml.toString()
                ));
            }
        }

        String targetTitle = (roadmap != null && roadmap.careerTitle() != null)
                ? roadmap.careerTitle()
                : "Staff Systems & Infrastructure Architect";

        String body = """
            <div class="max-w-5xl mx-auto space-y-8">
                <!-- Header Card -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
                    <div class="space-y-1">
                        <span class="text-xs font-semibold text-[#3E5A46] uppercase tracking-wider">Active Growth Trajectory</span>
                        <h1 class="font-editorial text-2xl font-semibold text-[#222421]">%s</h1>
                        <p class="text-xs text-[#5C6059]">Paced for 6 hours/week commitment across multi-stage progression phases.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono-tabular bg-[#EEF4EE] text-[#2A4031] px-3 py-1.5 rounded font-semibold border border-[#DCE7DC]">Paced Progression</span>
                    </div>
                </div>

                <!-- Progress Review Callout (Human-in-the-Loop) -->
                <div class="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-6 space-y-4 shadow-xs">
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded">Action Required: Milestone Review</span>
                            <h3 class="font-semibold text-sm text-[#92400E] mt-1.5">Did you complete: "Distributed System Latency Audit"?</h3>
                        </div>
                        <span class="text-xs text-[#B45309] font-mono-tabular">Detected from journal reflection</span>
                    </div>
                    <p class="text-xs text-[#78350F] italic">
                        &ldquo;Led cross-functional architecture review and resolved database connection bottleneck for the search pipeline.&rdquo;
                    </p>
                    <div class="flex items-center gap-3 pt-1">
                        <button onclick="alert('Milestone confirmed completed!'); window.location.reload();"
                            class="px-4 py-1.5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors">
                            Yes, Confirm Completed
                        </button>
                        <button onclick="alert('Milestone kept In Progress.'); window.location.reload();"
                            class="px-3.5 py-1.5 bg-white border border-[#D5D2CC] hover:bg-[#FAF8F5] text-[#5C6059] text-xs font-medium rounded transition-colors">
                            Not Yet (Keep In Progress)
                        </button>
                    </div>
                </div>

                <!-- Phases Breakdown -->
                <div class="space-y-6">
                    %s
                </div>
            </div>
            """.formatted(
                UiComponents.escape(targetTitle),
                phasesHtml.toString()
        );

        return UiComponents.wrapPage("Career Roadmap", "roadmap", user, body);
    }
}
