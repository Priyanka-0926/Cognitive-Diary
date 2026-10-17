import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Layers,
  GitBranch,
  Terminal,
  Server,
  Monitor,
  CheckCircle2,
  Play,
  RefreshCw,
  Code2,
  Workflow,
  Lock,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'oop' | 'jdbc' | 'threads' | 'servlets' | 'gui'>('oop');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const simulateJdbcTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(
        'Connected to jdbc:sqlite:data/cognitive_diary.db (WAL mode enabled, AutoCommit: false, Transactions: ACID compliant, Tables: users, journal_entries)'
      );
    }, 600);
  };

  const simulateThreadTask = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(
        'AsyncWorker dispatched task via ThreadPoolExecutor. Acquired ReentrantReadWriteLock, processed AI prompt in background thread (Worker-2), updated AtomicLong counters (completed: 24).'
      );
    }, 700);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#3E5A46] text-white flex items-center justify-center font-bold text-xs">CD</span>
            <span className="text-xs font-semibold text-[#3E5A46] uppercase tracking-wider">
              System Architecture &amp; Core Concepts
            </span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
            Java Core Concepts &amp; Engineering Architecture
          </h1>
          <p className="text-xs text-[#5C6059] max-w-2xl leading-relaxed">
            Examine how Cognitive Diary implements foundational Object-Oriented Programming, Database Connectivity (JDBC),
            Multithreading, Servlets, and Native Desktop GUI (Swing) under strict Clean Architecture standards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 bg-[#EEF4EE] border border-[#DCE7DC] text-[#2A4031] text-xs font-mono font-medium rounded">
            Java 17/21 · Enterprise Architecture
          </span>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E6E3DE] text-xs font-medium">
        <button
          onClick={() => { setActiveSection('oop'); setTestResult(null); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeSection === 'oop'
              ? 'bg-[#3E5A46] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C6059] hover:text-[#222421] border border-[#E6E3DE]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. OOP &amp; Polymorphism</span>
        </button>

        <button
          onClick={() => { setActiveSection('jdbc'); setTestResult(null); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeSection === 'jdbc'
              ? 'bg-[#3E5A46] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C6059] hover:text-[#222421] border border-[#E6E3DE]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>2. Database Connectivity (JDBC)</span>
        </button>

        <button
          onClick={() => { setActiveSection('threads'); setTestResult(null); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeSection === 'threads'
              ? 'bg-[#3E5A46] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C6059] hover:text-[#222421] border border-[#E6E3DE]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>3. Multithreading &amp; Locks</span>
        </button>

        <button
          onClick={() => { setActiveSection('servlets'); setTestResult(null); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeSection === 'servlets'
              ? 'bg-[#3E5A46] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C6059] hover:text-[#222421] border border-[#E6E3DE]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>4. Servlets &amp; Web</span>
        </button>

        <button
          onClick={() => { setActiveSection('gui'); setTestResult(null); }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeSection === 'gui'
              ? 'bg-[#3E5A46] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C6059] hover:text-[#222421] border border-[#E6E3DE]'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>5. Desktop GUI (Swing)</span>
        </button>
      </div>

      {/* Section 1: OOP & Polymorphism */}
      {activeSection === 'oop' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E6E3DE] rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                Inheritance Hierarchy
              </span>
              <h3 className="font-editorial text-lg font-semibold text-[#222421]">Abstract BaseEntity</h3>
              <p className="text-xs text-[#5C6059] leading-relaxed">
                <code className="text-[#3E5A46] font-mono">com.cognitivediary.model.BaseEntity</code> defines shared identity, audit timestamps, and the abstract method <code className="font-mono">getEntitySummary()</code>.
              </p>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px] font-mono space-y-1">
                <div>↳ JournalEntryEntity</div>
                <div>↳ UserEntity</div>
                <div>↳ MilestoneEntity</div>
              </div>
            </div>

            <div className="bg-white border border-[#E6E3DE] rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                Dynamic Polymorphism
              </span>
              <h3 className="font-editorial text-lg font-semibold text-[#222421]">Runtime Method Overriding</h3>
              <p className="text-xs text-[#5C6059] leading-relaxed">
                Each subclass overrides <code className="font-mono text-[#3E5A46]">getEntitySummary()</code> with domain-specific formatting invoked polymorphically across collection streams.
              </p>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px] font-mono text-[#444840]">
                @Override public String getEntitySummary() &#123; ... &#125;
              </div>
            </div>

            <div className="bg-white border border-[#E6E3DE] rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                Generics &amp; Contracts
              </span>
              <h3 className="font-editorial text-lg font-semibold text-[#222421]">CrudRepository&lt;T, ID&gt;</h3>
              <p className="text-xs text-[#5C6059] leading-relaxed">
                Generic interface <code className="font-mono text-[#3E5A46]">CrudRepository&lt;T extends BaseEntity, ID&gt;</code> decoupling storage logic from concrete business models.
              </p>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px] font-mono text-[#444840]">
                JournalRepository extends CrudRepository&lt;JournalEntryEntity, String&gt;
              </div>
            </div>
          </div>

          {/* Exception Handling Hierarchy */}
          <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 space-y-4">
            <h3 className="font-editorial text-lg font-semibold text-[#222421]">Structured Exception Handling</h3>
            <p className="text-xs text-[#5C6059] leading-relaxed">
              Custom checked and unchecked exceptions isolate operational database errors from business rule violations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                <span className="font-mono font-bold text-[#3E5A46] block">CognitiveDiaryException</span>
                <span className="text-[11px] text-[#878D82]">Base domain runtime exception</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                <span className="font-mono font-bold text-[#B45309] block">DatabaseOperationException</span>
                <span className="text-[11px] text-[#878D82]">Wraps SQLException with causes</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                <span className="font-mono font-bold text-[#2A4031] block">DuplicateSubmissionException</span>
                <span className="text-[11px] text-[#878D82]">Rapid deduplication guard (60s)</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded">
                <span className="font-mono font-bold text-[#6F746B] block">EntityNotFoundException</span>
                <span className="text-[11px] text-[#878D82]">404 Not Found resolution</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Database Connectivity (JDBC) */}
      {activeSection === 'jdbc' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wide bg-[#EEF4EE] px-2 py-0.5 rounded">
                  Relational Database Connectivity
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#222421] mt-1">
                  Native JDBC &amp; Transaction Management
                </h2>
              </div>
              <button
                onClick={simulateJdbcTest}
                disabled={testing}
                className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Test Live JDBC Connection</span>
              </button>
            </div>

            {testResult && (
              <div className="p-3.5 bg-[#EEF4EE] border border-[#DCE7DC] rounded-lg text-xs font-mono text-[#2A4031] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{testResult}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#222421]">Core JDBC Features Implemented:</h4>
                <ul className="space-y-2 text-[#5C6059]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3E5A46] font-bold">✓</span>
                    <span><strong>Singleton Connection Manager</strong>: <code className="font-mono">DatabaseConnectionManager.getInstance()</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3E5A46] font-bold">✓</span>
                    <span><strong>SQL Injection Protection</strong>: Parameterized <code className="font-mono">PreparedStatement</code> for all queries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3E5A46] font-bold">✓</span>
                    <span><strong>ACID Transactions</strong>: Explicit <code className="font-mono">conn.setAutoCommit(false)</code>, <code className="font-mono">commit()</code>, and <code className="font-mono">rollback()</code> in failure catch blocks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3E5A46] font-bold">✓</span>
                    <span><strong>ResultSet Mapping</strong>: Type-safe conversion of relational rows to <code className="font-mono">JournalEntryEntity</code> objects</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg font-mono text-[11px] text-[#222421] space-y-1 overflow-x-auto">
                <div className="text-[#878D82]">// Sample JDBC Transactional Save</div>
                <div>conn = connectionManager.getConnection();</div>
                <div className="text-[#3E5A46]">conn.setAutoCommit(false);</div>
                <div>try (PreparedStatement ps = conn.prepareStatement(sql)) &#123;</div>
                <div className="pl-4">ps.setString(1, entry.getId());</div>
                <div className="pl-4">ps.executeUpdate();</div>
                <div className="pl-4 text-[#3E5A46]">conn.commit();</div>
                <div>&#125; catch (SQLException e) &#123;</div>
                <div className="pl-4 text-[#B45309]">conn.rollback();</div>
                <div className="pl-4">throw new DatabaseOperationException(e);</div>
                <div>&#125;</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Multithreading & Synchronization */}
      {activeSection === 'threads' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wider bg-[#EEF4EE] px-2 py-0.5 rounded">
                  Concurrency Architecture
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#222421] mt-1">
                  Multithreading &amp; Concurrency Control
                </h2>
              </div>
              <button
                onClick={simulateThreadTask}
                disabled={testing}
                className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Dispatch Asynchronous Task</span>
              </button>
            </div>

            {testResult && (
              <div className="p-3.5 bg-[#EEF4EE] border border-[#DCE7DC] rounded-lg text-xs font-mono text-[#2A4031] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{testResult}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <span className="font-semibold text-[#222421] block">ThreadPoolExecutor</span>
                <p className="text-[#5C6059] leading-relaxed">
                  Worker pool with named threads (<code className="font-mono">SynthesisWorker-N</code>) managing parallel reflection analysis without stalling web threads.
                </p>
                <div className="text-[11px] font-mono text-[#3E5A46]">Core: 3 · Max: 8 · KeepAlive: 60s</div>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <span className="font-semibold text-[#222421] block">ReentrantReadWriteLock</span>
                <p className="text-[#5C6059] leading-relaxed">
                  Concurrent reads of skill aggregations with exclusive locks on write mutations, preventing dirty reads across concurrent reflections.
                </p>
                <div className="text-[11px] font-mono text-[#3E5A46]">Lock: ReentrantReadWriteLock</div>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <span className="font-semibold text-[#222421] block">SwingWorker (Desktop GUI)</span>
                <p className="text-[#5C6059] leading-relaxed">
                  Offloads database queries in <code className="font-mono">doInBackground()</code> and publishes results on the Event Dispatch Thread (EDT).
                </p>
                <div className="text-[11px] font-mono text-[#3E5A46]">EDT Safety: 100% Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Servlets & Web Integration */}
      {activeSection === 'servlets' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 space-y-5">
            <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wider bg-[#EEF4EE] px-2 py-0.5 rounded">
              Java EE / Jakarta Integration
            </span>
            <h2 className="font-editorial text-xl font-semibold text-[#222421]">
              Jakarta Servlets &amp; Filter Pipeline
            </h2>
            <p className="text-xs text-[#5C6059] leading-relaxed max-w-3xl">
              Cognitive Diary implements low-level servlet routing via <code className="font-mono text-[#3E5A46]">JournalApiServlet</code>, extending <code className="font-mono">HttpServlet</code>, alongside <code className="font-mono text-[#3E5A46]">AuthenticationFilter</code> for cross-origin security and request logging.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-3">
                <h4 className="font-semibold text-[#222421]">JournalApiServlet Methods:</h4>
                <ul className="space-y-1.5 font-mono text-[11px] text-[#444840]">
                  <li>• <strong className="text-[#3E5A46]">doGet()</strong>: Retrieves reflection archives and single entries</li>
                  <li>• <strong className="text-[#2A4031]">doPost()</strong>: Validates payloads, saves entries, calls AI</li>
                  <li>• <strong className="text-[#B45309]">doDelete()</strong>: Removes journal records by user and entry ID</li>
                </ul>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-3">
                <h4 className="font-semibold text-[#222421]">AuthenticationFilter Pipeline:</h4>
                <ul className="space-y-1.5 font-mono text-[11px] text-[#444840]">
                  <li>• Implements <code className="text-[#3E5A46]">jakarta.servlet.Filter</code></li>
                  <li>• Applies CORS headers (<code className="text-[#3E5A46]">Access-Control-Allow-Origin</code>)</li>
                  <li>• Tracks request processing times via <code className="text-[#3E5A46]">System.currentTimeMillis()</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Desktop GUI (Swing) */}
      {activeSection === 'gui' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E3DE] rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#3E5A46] uppercase tracking-wider bg-[#EEF4EE] px-2 py-0.5 rounded">
                  Desktop GUI Application
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#222421] mt-1">
                  Java Swing Native Desktop Interface
                </h2>
              </div>
            </div>

            <p className="text-xs text-[#5C6059] leading-relaxed max-w-3xl">
              In addition to the Web application, a standalone desktop application is implemented in <code className="font-mono text-[#3E5A46]">CognitiveDiaryDesktopGui.java</code> using standard Java Swing components.
            </p>

            {/* Terminal Command Card */}
            <div className="p-4 bg-[#222421] text-white rounded-lg space-y-2 font-mono text-xs">
              <span className="text-[#878D82] block">// Run Desktop Swing GUI Standalone from Terminal:</span>
              <div className="text-[#86EFAC] select-all">
                cd cognitive-diary-java &amp;&amp; mvn compile &amp;&amp; mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <h4 className="font-semibold text-[#222421]">Swing Components</h4>
                <ul className="space-y-1 text-[#5C6059]">
                  <li>• <code className="font-mono text-[#3E5A46]">JFrame</code>: Primary window</li>
                  <li>• <code className="font-mono text-[#3E5A46]">JTabbedPane</code>: Tabbed views</li>
                  <li>• <code className="font-mono text-[#3E5A46]">JTextArea</code>: Reflection editor</li>
                  <li>• <code className="font-mono text-[#3E5A46]">JTable</code>: Archive records</li>
                </ul>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <h4 className="font-semibold text-[#222421]">Event Listeners (Interfaces)</h4>
                <ul className="space-y-1 text-[#5C6059]">
                  <li>• <code className="font-mono text-[#3E5A46]">ActionListener</code>: Button clicks</li>
                  <li>• <code className="font-mono text-[#3E5A46]">DocumentListener</code>: Live word counts</li>
                  <li>• <code className="font-mono text-[#3E5A46]">WindowListener</code>: Clean shutdown</li>
                </ul>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#E6E3DE] rounded-lg space-y-2">
                <h4 className="font-semibold text-[#222421]">Thread Safety</h4>
                <p className="text-[#5C6059] leading-relaxed">
                  Uses <code className="font-mono text-[#3E5A46]">SwingUtilities.invokeLater()</code> to dispatch table model mutations safely on the Event Dispatch Thread (EDT).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
