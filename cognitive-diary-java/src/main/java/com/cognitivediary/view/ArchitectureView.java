package com.cognitivediary.view;

import com.cognitivediary.model.Models.User;

public class ArchitectureView {

    public static String render(User user) {
        String body = """
            <div class="max-w-6xl mx-auto space-y-8 pb-12">
                <!-- Header -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div class="space-y-1">
                        <span class="text-xs font-semibold text-[#3E5A46] uppercase tracking-wider">
                            System Architecture &amp; Core Concepts
                        </span>
                        <h1 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
                            Java Core Concepts &amp; Engineering Architecture
                        </h1>
                        <p class="text-xs text-[#5C6059] max-w-2xl leading-relaxed">
                            Demonstrating Object-Oriented Programming (OOP), Database Connectivity (JDBC),
                            Multithreading &amp; Synchronization, Jakarta Servlets, and Desktop Swing GUI integration.
                        </p>
                    </div>
                    <span class="px-3 py-1 bg-[#EEF4EE] border border-[#DCE7DC] text-[#2A4031] text-xs font-mono font-medium rounded">
                        Java 17/21 · Enterprise Stack
                    </span>
                </div>

                <!-- 5 Architecture Pillars Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                    <!-- Pillar 1: OOP & Polymorphism -->
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                        <span class="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                            1. OOP &amp; Polymorphism
                        </span>
                        <h3 class="font-editorial text-lg font-semibold text-[#222421]">Inheritance &amp; Interfaces</h3>
                        <p class="text-[#5C6059] leading-relaxed">
                            Abstract base class <code class="text-[#3E5A46] font-mono">BaseEntity</code> extended by <code class="font-mono">JournalEntryEntity</code>, <code class="font-mono">UserEntity</code>, and <code class="font-mono">MilestoneEntity</code> overriding <code class="font-mono">getEntitySummary()</code> polymorphically.
                        </p>
                        <div class="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded font-mono text-[11px] text-[#444840]">
                            CrudRepository&lt;T, ID&gt; &rarr; JournalRepository
                        </div>
                    </div>

                    <!-- Pillar 2: Database Connectivity (JDBC) -->
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                        <span class="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                            2. Database Connectivity (JDBC)
                        </span>
                        <h3 class="font-editorial text-lg font-semibold text-[#222421]">Native JDBC Transactions</h3>
                        <p class="text-[#5C6059] leading-relaxed">
                            Singleton <code class="text-[#3E5A46] font-mono">DatabaseConnectionManager</code> with SQLite &amp; H2 embedded drivers. Parameterized <code class="font-mono">PreparedStatement</code>, <code class="font-mono">ResultSet</code> mapping, and manual transactions with <code class="font-mono">commit()</code> and <code class="font-mono">rollback()</code>.
                        </p>
                        <div class="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded font-mono text-[11px] text-[#3E5A46]">
                            jdbc:sqlite:data/cognitive_diary.db
                        </div>
                    </div>

                    <!-- Pillar 3: Multithreading & Synchronization -->
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                        <span class="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                            3. Multithreading &amp; Locks
                        </span>
                        <h3 class="font-editorial text-lg font-semibold text-[#222421]">ThreadPoolExecutor &amp; Locks</h3>
                        <p class="text-[#5C6059] leading-relaxed">
                            <code class="text-[#3E5A46] font-mono">AsyncSynthesisEngine</code> dispatches background AI tasks via <code class="font-mono">CompletableFuture</code>. Thread-safe concurrency protected by <code class="font-mono">ReentrantReadWriteLock</code> and <code class="font-mono">AtomicLong</code>.
                        </p>
                        <div class="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded font-mono text-[11px] text-[#444840]">
                            Workers: SynthesisWorker-N · Lock: ReadWrite
                        </div>
                    </div>

                    <!-- Pillar 4: Servlets & Web Integration -->
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                        <span class="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                            4. Servlets &amp; Web Integration
                        </span>
                        <h3 class="font-editorial text-lg font-semibold text-[#222421]">Jakarta HttpServlet &amp; Filters</h3>
                        <p class="text-[#5C6059] leading-relaxed">
                            <code class="text-[#3E5A46] font-mono">JournalApiServlet</code> extends <code class="font-mono">HttpServlet</code> handling <code class="font-mono">doGet()</code>, <code class="font-mono">doPost()</code>, and <code class="font-mono">doDelete()</code> directly, filtered by <code class="font-mono">AuthenticationFilter</code>.
                        </p>
                        <div class="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded font-mono text-[11px] text-[#444840]">
                            @WebServlet("/servlet/journal/*")
                        </div>
                    </div>

                    <!-- Pillar 5: Desktop GUI (Swing) -->
                    <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4 md:col-span-2">
                        <span class="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                            5. Desktop GUI (Java Swing)
                        </span>
                        <h3 class="font-editorial text-lg font-semibold text-[#222421]">Native Desktop Interface</h3>
                        <p class="text-[#5C6059] leading-relaxed">
                            <code class="text-[#3E5A46] font-mono">CognitiveDiaryDesktopGui.java</code> extends <code class="font-mono">JFrame</code> with <code class="font-mono">JTabbedPane</code>, <code class="font-mono">JTable</code> with <code class="font-mono">DefaultTableModel</code>, and asynchronous <code class="font-mono">SwingWorker</code> threads for non-blocking database queries.
                        </p>
                        <div class="p-3 bg-[#222421] text-white rounded font-mono text-[11px] space-y-1">
                            <span class="text-[#878D82] block">// Terminal Command to Launch Desktop GUI:</span>
                            <div class="text-[#86EFAC] select-all">cd cognitive-diary-java &amp;&amp; mvn compile &amp;&amp; mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"</div>
                        </div>
                    </div>
                </div>
            </div>
            """;

        return UiComponents.wrapPage("System Architecture & Concepts", "architecture", user, body);
    }
}
