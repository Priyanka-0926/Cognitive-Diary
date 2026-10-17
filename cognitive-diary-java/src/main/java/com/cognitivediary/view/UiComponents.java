package com.cognitivediary.view;

import com.cognitivediary.model.Models.User;

public class UiComponents {

    public static String renderHead(String title) {
        return """
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s · Cognitive Diary (Pure Java Edition)</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
                    .font-editorial { font-family: 'Fraunces', Georgia, serif; }
                    .font-mono-tabular { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
                </style>
            </head>
            """.formatted(escape(title));
    }

    public static String renderHeader(String activeTab, User user) {
        String displayName = (user != null && user.displayName() != null) ? user.displayName() : "Elena Rostova";
        boolean isDemo = user != null && user.isDemo();

        return """
            <header class="bg-white border-b border-[#E6E3DE] sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div class="flex items-center gap-6">
                        <a href="/overview" class="flex items-center gap-2 group">
                            <span class="w-8 h-8 rounded bg-[#3E5A46] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-[#2A4031] transition-colors">CD</span>
                            <div>
                                <span class="font-editorial text-lg font-semibold tracking-tight text-[#222421] block leading-none">Cognitive Diary</span>
                                <span class="text-[10px] text-[#878D82] font-mono-tabular">100%% Java Spring Engine</span>
                            </div>
                        </a>
                        <nav class="hidden md:flex items-center gap-1 text-xs font-medium">
                            %s
                            %s
                            %s
                            %s
                            %s
                            %s
                            %s
                            %s
                        </nav>
                    </div>
                    <div class="flex items-center gap-3">
                        %s
                        <a href="/journal" class="px-3.5 py-1.5 text-xs font-medium text-white bg-[#3E5A46] hover:bg-[#2A4031] rounded transition-colors shadow-xs flex items-center gap-1.5">
                            <span>+ Write Reflection</span>
                        </a>
                    </div>
                </div>
            </header>
            """.formatted(
                navLink("/overview", "Overview", "overview".equals(activeTab)),
                navLink("/journal", "Write", "journal".equals(activeTab)),
                navLink("/archive", "Archive", "archive".equals(activeTab)),
                navLink("/strengths", "Strengths", "strengths".equals(activeTab)),
                navLink("/careers", "Careers", "careers".equals(activeTab)),
                navLink("/roadmap", "Roadmap", "roadmap".equals(activeTab)),
                navLink("/architecture", "Architecture", "architecture".equals(activeTab)),
                navLink("/settings", "Settings", "settings".equals(activeTab)),
                isDemo ? "<span class=\"text-[11px] font-medium text-[#3E5A46] bg-[#EEF4EE] px-2.5 py-1 rounded border border-[#DCE7DC]\">Demo Persona</span>" : ""
            );
    }

    private static String navLink(String href, String label, boolean active) {
        String activeClass = active
                ? "bg-[#EEF4EE] text-[#2A4031] font-semibold"
                : "text-[#5C6059] hover:text-[#222421] hover:bg-[#FAF8F5]";
        return "<a href=\"" + href + "\" class=\"px-3 py-1.5 rounded transition-colors " + activeClass + "\">" + label + "</a>";
    }

    public static String renderFooter() {
        return """
            <footer class="bg-white border-t border-[#E6E3DE] py-6 text-center text-xs text-[#878D82] mt-auto">
                <p>Cognitive Diary · 100% Pure Java Spring Boot Architecture · Evidence-Grounded Career Discovery</p>
            </footer>
            """;
    }

    public static String wrapPage(String title, String activeTab, User user, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            %s
            <body class="bg-[#F8F7F4] text-[#222421] min-h-screen antialiased flex flex-col">
                %s
                <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    %s
                </main>
                %s
            </body>
            </html>
            """.formatted(
                renderHead(title),
                renderHeader(activeTab, user),
                bodyContent,
                renderFooter()
            );
    }

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
