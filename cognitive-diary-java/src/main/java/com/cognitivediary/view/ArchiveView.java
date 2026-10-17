package com.cognitivediary.view;

import com.cognitivediary.model.Models.JournalEntry;
import com.cognitivediary.model.Models.SkillItem;
import com.cognitivediary.model.Models.User;

import java.util.List;

public class ArchiveView {

    public static String render(User user, List<JournalEntry> entries, String searchQuery) {
        StringBuilder entriesHtml = new StringBuilder();

        if (entries == null || entries.isEmpty()) {
            entriesHtml.append("""
                <div class="p-12 text-center bg-white border border-[#E6E3DE] rounded-xl space-y-2">
                    <h3 class="text-sm font-semibold text-[#222421]">No reflections found</h3>
                    <p class="text-xs text-[#5C6059]">Try clearing your search query or writing a new reflection.</p>
                </div>
                """);
        } else {
            for (JournalEntry entry : entries) {
                StringBuilder skillsPills = new StringBuilder();
                if (entry.analysis() != null && entry.analysis().skills() != null) {
                    for (SkillItem s : entry.analysis().skills()) {
                        skillsPills.append("""
                            <span class="px-2 py-0.5 bg-white border border-[#DCE7DC] rounded text-[11px] text-[#2A4031] font-medium">%s</span>
                            """.formatted(UiComponents.escape(s.name())));
                    }
                }

                String analysisSection = (entry.analysis() != null && entry.analysis().summary() != null)
                        ? """
                        <div class="p-4 bg-[#FAF8F5] rounded border border-[#E6E3DE] space-y-2 mt-3">
                            <span class="text-[10px] font-semibold text-[#878D82] uppercase tracking-wide block">Synthesized Competencies</span>
                            <p class="text-xs text-[#444840]">%s</p>
                            <div class="flex flex-wrap gap-2 pt-1">%s</div>
                        </div>
                        """.formatted(UiComponents.escape(entry.analysis().summary()), skillsPills.toString())
                        : "";

                entriesHtml.append("""
                    <div class="bg-white border border-[#E6E3DE] rounded-lg overflow-hidden shadow-xs">
                        <div class="p-4 bg-[#FAF8F5]/60 border-b border-[#E6E3DE] flex items-center justify-between text-xs">
                            <div class="flex items-center gap-3">
                                <span class="font-mono-tabular font-semibold text-[#222421]">%s</span>
                                <span class="text-[#878D82]">·</span>
                                <span class="text-[#5C6059]">%d words</span>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4EE] text-[#3E5A46]">%s</span>
                        </div>
                        <div class="p-5 space-y-3">
                            <p class="text-sm text-[#222421] whitespace-pre-wrap leading-relaxed">%s</p>
                            %s
                        </div>
                    </div>
                    """.formatted(
                        UiComponents.escape(entry.entryDate()),
                        entry.wordCount(),
                        UiComponents.escape(entry.analysisStatus()),
                        UiComponents.escape(entry.originalText()),
                        analysisSection
                ));
            }
        }

        String body = """
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3DE]">
                    <div>
                        <h1 class="font-editorial text-2xl font-semibold text-[#222421]">Reflection Archive</h1>
                        <p class="text-xs text-[#5C6059] mt-0.5">Search and examine historical entries, extracted evidence, and AI cognitive feedback.</p>
                    </div>
                    <form action="/archive" method="get" class="flex items-center gap-2 w-full sm:w-auto">
                        <input type="text" name="search" value="%s" placeholder="Search reflections or skills..."
                            class="px-3 py-1.5 bg-white border border-[#D5D2CC] rounded text-xs w-full sm:w-64 focus:ring-1 focus:ring-[#3E5A46] outline-none">
                        <button type="submit" class="px-3 py-1.5 bg-[#3E5A46] text-white rounded text-xs font-medium hover:bg-[#2A4031]">Filter</button>
                    </form>
                </div>

                <div class="space-y-4">
                    %s
                </div>
            </div>
            """.formatted(
                UiComponents.escape(searchQuery != null ? searchQuery : ""),
                entriesHtml.toString()
        );

        return UiComponents.wrapPage("Reflection Archive", "archive", user, body);
    }
}
