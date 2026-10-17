package com.cognitivediary.view;

import com.cognitivediary.model.Models.CareerHypothesis;
import com.cognitivediary.model.Models.User;

import java.util.List;

public class CareersView {

    public static String render(User user, List<CareerHypothesis> hypotheses) {
        StringBuilder hypothesesCards = new StringBuilder();

        if (hypotheses == null || hypotheses.isEmpty()) {
            hypothesesCards.append("""
                <div class="col-span-2 p-12 text-center bg-white border border-[#E6E3DE] rounded-xl space-y-2">
                    <h3 class="text-sm font-semibold text-[#222421]">No hypotheses synthesized yet</h3>
                    <p class="text-xs text-[#5C6059]">Synthesize grounded career directions from your journal evidence.</p>
                </div>
                """);
        } else {
            for (CareerHypothesis h : hypotheses) {
                hypothesesCards.append("""
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-5">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] font-semibold uppercase tracking-wider text-[#3E5A46] bg-[#EEF4EE] px-2.5 py-1 rounded border border-[#DCE7DC]">%s Evidence</span>
                                <h2 class="font-editorial text-xl font-semibold text-[#222421] mt-2">%s</h2>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <span class="text-[11px] font-semibold text-[#878D82] uppercase tracking-wide">Why It Fits You</span>
                            <p class="text-xs text-[#444840] leading-relaxed">%s</p>
                        </div>

                        <div class="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                            <span class="text-[11px] font-semibold text-[#3E5A46] block">Small Safe Experiment</span>
                            <p class="text-xs text-[#222421] italic">&ldquo;%s&rdquo;</p>
                        </div>

                        <div class="flex items-center justify-between pt-2 border-t border-[#F2EFEB]">
                            <a href="/roadmap" class="px-4 py-1.5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-medium rounded transition-colors">Adopt Roadmap</a>
                            <span class="text-xs text-[#878D82] font-mono-tabular">Target Role</span>
                        </div>
                    </div>
                    """.formatted(
                        UiComponents.escape(h.evidenceStrength()),
                        UiComponents.escape(h.title()),
                        UiComponents.escape(h.whyItMayFit()),
                        UiComponents.escape(h.smallExperiment())
                ));
            }
        }

        String body = """
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
                    <div>
                        <h1 class="font-editorial text-2xl font-semibold text-[#222421]">Career Hypotheses</h1>
                        <p class="text-xs text-[#5C6059] mt-0.5">Evidence-grounded potential career directions deduced from your actual journal reflections.</p>
                    </div>
                    <button onclick="synthesizeCareers()" id="synthBtn" class="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center gap-2">
                        <span>Resynthesize Hypotheses</span>
                    </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    %s
                </div>
            </div>

            <script>
                async function synthesizeCareers() {
                    const btn = document.getElementById('synthBtn');
                    btn.disabled = true;
                    btn.innerText = 'Synthesizing with Gemini...';
                    try {
                        const res = await fetch('/api/careers/synthesize', { method: 'POST' });
                        if (res.ok) {
                            window.location.reload();
                        } else {
                            const err = await res.json();
                            alert(err.error || 'Requires reflections across at least 2 distinct days.');
                        }
                    } catch (e) {
                        alert('Synthesis network error.');
                    } finally {
                        btn.disabled = false;
                        btn.innerText = 'Resynthesize Hypotheses';
                    }
                }
            </script>
            """.formatted(hypothesesCards.toString());

        return UiComponents.wrapPage("Career Discovery", "careers", user, body);
    }
}
