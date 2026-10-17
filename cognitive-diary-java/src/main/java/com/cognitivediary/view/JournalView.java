package com.cognitivediary.view;

import com.cognitivediary.model.Models.JournalEntry;
import com.cognitivediary.model.Models.User;

import java.time.LocalDate;

public class JournalView {

    public static String render(User user, JournalEntry editing, boolean aiConfigured) {
        String initialText = editing != null ? UiComponents.escape(editing.originalText()) : "";
        String initialDate = editing != null ? editing.entryDate() : LocalDate.now().toString();
        String titleHeading = editing != null ? "Edit Reflection" : "Daily Work Reflection";

        String body = """
            <div class="max-w-4xl mx-auto space-y-6">
                <div class="flex items-center justify-between pb-3 border-b border-[#E6E3DE]">
                    <div>
                        <h1 class="font-editorial text-2xl font-semibold text-[#222421]">%s</h1>
                        <p class="text-xs text-[#5C6059] mt-0.5">
                            Write naturally about decisions made, technical challenges solved, or what gave you momentum today.
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <input type="date" id="entryDate" name="entryDate" class="text-xs px-2.5 py-1.5 bg-white border border-[#D5D2CC] rounded font-mono-tabular text-[#222421]" value="%s">
                    </div>
                </div>

                <!-- Editor Card -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                    <div class="p-3.5 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg text-xs space-y-1">
                        <span class="font-semibold text-[#3E5A46] block">Guiding Prompt:</span>
                        <p class="text-[#5C6059] italic">
                            &ldquo;What was a hard problem you dissected this week, and how did your approach affect the team&rsquo;s velocity or codebase health?&rdquo;
                        </p>
                    </div>

                    <div>
                        <textarea id="journalText" rows="12"
                            class="w-full p-4 border border-[#D5D2CC] rounded-lg text-sm leading-relaxed text-[#222421] focus:ring-2 focus:ring-[#3E5A46] focus:border-transparent outline-none resize-y placeholder:text-[#878D82]/60"
                            placeholder="Today I spent time refactoring our query optimizer pipeline. The memory allocation during large join batches was causing P99 spikes. I profiled the JVM heap and isolated unnecessary object allocations..."
                            oninput="updateWordCount(this.value)">%s</textarea>
                    </div>

                    <div class="flex items-center justify-between pt-3 border-t border-[#F2EFEB]">
                        <div class="flex items-center gap-4 text-xs text-[#878D82]">
                            <span id="wordCountDisplay" class="font-mono-tabular font-medium text-[#222421]">0 words</span>
                            <span>·</span>
                            <span id="statusMessage" class="text-[#3E5A46]">Ready</span>
                        </div>

                        <div class="flex items-center gap-3">
                            <button type="button" onclick="saveReflection()" id="saveBtn"
                                class="px-5 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center gap-2">
                                <span>Save &amp; Analyze</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- AI Analysis Card -->
                <div id="analysisCard" class="hidden bg-white border border-[#DCE7DC] rounded-xl p-6 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-2 border-b border-[#E6E3DE]">
                        <span class="text-xs font-semibold text-[#3E5A46] uppercase tracking-wider">AI Cognitive Synthesis</span>
                        <span class="text-[10px] text-[#878D82] font-mono-tabular">Gemini Flash Analysis</span>
                    </div>
                    <p id="analysisSummary" class="text-sm text-[#222421] leading-relaxed"></p>
                    <div id="skillsList" class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2"></div>
                </div>
            </div>

            <script>
                function updateWordCount(val) {
                    const words = val.trim() ? val.trim().split(/\\s+/).length : 0;
                    document.getElementById('wordCountDisplay').innerText = words + ' words';
                }
                updateWordCount(document.getElementById('journalText').value);

                async function saveReflection() {
                    const text = document.getElementById('journalText').value;
                    const date = document.getElementById('entryDate').value;
                    const saveBtn = document.getElementById('saveBtn');
                    const statusMsg = document.getElementById('statusMessage');

                    if (!text.trim()) {
                        alert('Please write something before saving.');
                        return;
                    }

                    saveBtn.disabled = true;
                    saveBtn.innerText = 'Analyzing...';
                    statusMsg.innerText = 'Calling Java API & Gemini...';

                    try {
                        const res = await fetch('/api/journal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ originalText: text, entryDate: date })
                        });

                        const data = await res.json();
                        statusMsg.innerText = 'Saved successfully!';
                        saveBtn.innerText = 'Saved ✓';

                        if (data.entry && data.entry.analysis) {
                            const card = document.getElementById('analysisCard');
                            card.classList.remove('hidden');
                            document.getElementById('analysisSummary').innerText = data.entry.analysis.summary;

                            const sl = document.getElementById('skillsList');
                            sl.innerHTML = '';
                            if (data.entry.analysis.skills) {
                                data.entry.analysis.skills.forEach(s => {
                                    const d = document.createElement('div');
                                    d.className = 'p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-xs space-y-1';
                                    d.innerHTML = '<div class="font-semibold text-[#222421]">' + s.name + '</div><div class="text-[#6F746B] italic">\\"' + s.evidence + '\\"</div>';
                                    sl.appendChild(d);
                                });
                            }
                        }
                    } catch (err) {
                        statusMsg.innerText = 'Error saving entry.';
                        saveBtn.innerText = 'Retry';
                    } finally {
                        saveBtn.disabled = false;
                    }
                }
            </script>
            """.formatted(
                titleHeading,
                initialDate,
                initialText
        );

        return UiComponents.wrapPage("Write Reflection", "journal", user, body);
    }
}
