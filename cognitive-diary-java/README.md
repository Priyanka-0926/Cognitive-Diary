# Cognitive Diary · Java Edition (Web & GUI)

Comprehensive Java implementation engineered to meet university marking rubrics for both **Java GUI-Based Projects** and **Java Web-Based Projects**.

---

## Rubric Features Implemented

1. **OOP Core Principles**:
   - **Inheritance & Polymorphism**: `BaseEntity` abstract class with derived subclasses `JournalEntryEntity`, `UserEntity`, `MilestoneEntity` overriding `getEntitySummary()`.
   - **Interfaces**: Generic `CrudRepository<T, ID>` and `JournalRepository`.
   - **Exception Handling**: Custom hierarchy `CognitiveDiaryException`, `EntityNotFoundException`, `DuplicateSubmissionException`, `DatabaseOperationException`, `AiSynthesisException`.

2. **Collections & Generics**:
   - Generic types `CrudRepository<T extends BaseEntity, ID>`, `List<T>`, `Map<K, V>`, `ConcurrentHashMap`, and Java 8 Streams.

3. **Multithreading & Synchronization**:
   - `AsyncSynthesisEngine.java`: `ThreadPoolExecutor`, `ReentrantReadWriteLock`, `AtomicLong` counters.
   - `CognitiveDiaryDesktopGui.java`: Background `SwingWorker` for asynchronous JDBC database operations.

4. **Database Connectivity (JDBC)**:
   - `DatabaseConnectionManager.java`: Singleton JDBC connection manager with schema initialization.
   - `JdbcJournalRepository.java`: Parameterized `PreparedStatement` queries, `ResultSet` mapping, and manual transactions (`setAutoCommit(false)`, `commit()`, `rollback()`).

5. **Servlets & Web Integration**:
   - `JournalApiServlet.java`: Jakarta `HttpServlet` handling `doGet`, `doPost`, `doDelete`.
   - `AuthenticationFilter.java`: Jakarta `Filter` managing CORS and request metrics.
   - `com.cognitivediary.view.*`: Pure Java HTML rendering engine for all web pages.

6. **Java Desktop GUI (Swing)**:
   - `CognitiveDiaryDesktopGui.java`: Full `JFrame` desktop application with `JTabbedPane`, `JTextArea`, `JTable`, live word counter, search filtering, and JDBC status inspector.

---

## Running Instructions

```bash
# Web application
mvn clean package -DskipTests
mvn spring-boot:run

# Desktop GUI application
mvn compile
mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"
```
