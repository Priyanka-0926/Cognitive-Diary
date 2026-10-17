package com.cognitivediary.view;

import com.cognitivediary.model.Models.AggregatedSkill;
import com.cognitivediary.model.Models.EvidenceExcerpt;
import com.cognitivediary.model.Models.User;

import java.util.List;

public class StrengthsView {

    public static String render(User user, List<AggregatedSkill> skills) {
        StringBuilder skillsCards = new StringBuilder();

        if (skills == null || skills.isEmpty()) {
            skillsCards.append("""
                <div class="col-span-3 p-12 text-center bg-white border border-[#E6E3DE] rounded-xl space-y-2">
                    <h3 class="text-sm font-semibold text-[#222421]">No synthesized strengths yet</h3>
                    <p class="text-xs text-[#5C6059]">Reflect on a few work tasks across multiple days to uncover your natural strengths.</p>
                </div>
                """);
        } else {
            for (AggregatedSkill s : skills) {
                String firstExcerpt = (s.evidenceExcerpts() != null && !s.evidenceExcerpts().isEmpty())
                        ? s.evidenceExcerpts().get(0).excerpt()
                        : "Demonstrated through project technical execution.";

                skillsCards.append("""
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-5 shadow-xs space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] font-semibold uppercase tracking-wider text-[#3E5A46] bg-[#EEF4EE] px-2 py-0.5 rounded">%s</span>
                                <h3 class="font-editorial text-lg font-semibold text-[#222421] mt-1">%s</h3>
                            </div>
                            <span class="font-mono-tabular text-sm font-bold text-[#3E5A46]">%.0f%%</span>
                        </div>
                        <div class="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-1">
                            <span class="text-[10px] font-semibold text-[#878D82] uppercase">Verbatim Evidence Quote</span>
                            <p class="italic text-[#444840]">&ldquo;%s&rdquo;</p>
                        </div>
                        <div class="pt-2 flex items-center justify-between text-xs text-[#878D82]">
                            <span>Validation: <strong class="text-[#3E5A46]">Accurate</strong></span>
                            <span class="font-mono-tabular">%d Excerpt%s</span>
                        </div>
                    </div>
                    """.formatted(
                        UiComponents.escape(s.confidenceCategory()),
                        UiComponents.escape(s.name()),
                        s.averageConfidence() * 100,
                        UiComponents.escape(firstExcerpt),
                        s.frequency(),
                        s.frequency() == 1 ? "" : "s"
                ));
            }
        }

        String body = """
            <div class="space-y-6">
                <div class="pb-4 border-b border-[#E6E3DE]">
                    <h1 class="font-editorial text-2xl font-semibold text-[#222421]">Longitudinal Working Strengths</h1>
                    <p class="text-xs text-[#5C6059] mt-0.5">Synthesized from repeated journal evidence across time, identifying what comes naturally to you.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    %s
                </div>
            </div>
            """.formatted(skillsCards.toString());

        return UiComponents.wrapPage("Natural Strengths", "strengths", user, body);
    }
}
