# Cognitive Diary · AI Career Discovery Platform (Java & Web Editions)

An evidence-based personal growth and career discovery platform that transforms everyday reflective journaling into actionable career roadmaps, natural strengths synthesis, and milestone tracking.

---

## Marking Rubric Compliance & Architectural Mapping

This project is engineered to strictly satisfy both the **Java GUI-Based Projects Marking Rubric** and the **Java Web-Based Projects Marking Rubric**:

### Part A: Java GUI Based Projects Marking Rubric

| Rubric Criterion | Marks | Implementation & Class Mapping in Project |
| :--- | :---: | :--- |
| **OOP Implementation**<br>*(Polymorphism, Inheritance, Exception Handling, Interfaces)* | **10** | • **Inheritance & Polymorphism**: Abstract base class `com.cognitivediary.model.BaseEntity` with abstract method `getEntitySummary()`. Subclasses `JournalEntryEntity`, `UserEntity`, `MilestoneEntity` extend `BaseEntity` and provide polymorphic runtime implementations.<br>• **Interfaces**: `com.cognitivediary.repository.CrudRepository<T, ID>` and `JournalRepository` define strict contracts.<br>• **Exception Handling**: Custom exception hierarchy `CognitiveDiaryException`, `EntityNotFoundException`, `DuplicateSubmissionException`, `DatabaseOperationException`, `AiSynthesisException` with `try-catch-finally` handling. |
| **Collections & Generics** | **6** | • Generic repository `CrudRepository<T extends BaseEntity, ID>` with generic CRUD operations.<br>• Heavy use of Java Collections Framework: `List<T>`, `ArrayList<T>`, `Map<K, V>`, `ConcurrentHashMap<K, V>`, `DefaultTableModel` for Swing JTable data binding, and Java 8 Streams (`filter`, `map`, `sorted`, `collect`). |
| **Multithreading & Synchronization** | **4** | • **Asynchronous GUI Workers**: `SwingWorker<JournalEntryEntity, Void>` in `CognitiveDiaryDesktopGui.java` ensures database operations run on background threads without freezing the UI.<br>• **ExecutorService**: Dedicated thread pool `Executors.newFixedThreadPool(2)` for background table population.<br>• **Thread-safe locking**: `AsyncSynthesisEngine.java` uses `ReentrantReadWriteLock`, `AtomicLong` counters, and thread-safe synchronized queues. |
| **Classes for Database Operations** | **7** | • **Data Access Layer**: `JdbcJournalRepository.java` implements `JournalRepository`.<br>• Fully encapsulated SQL operations (`save`, `findById`, `findAll`, `findByUserId`, `searchByKeyword`, `deleteById`). |
| **Database Connectivity (JDBC)** | **3** | • `DatabaseConnectionManager.java` manages thread-safe JDBC connections using SQLite / H2 drivers.<br>• Auto-bootstraps relational tables (`users`, `journal_entries`) on startup. |
| **Implement JDBC for Connectivity** | **3** | • Parameterized `PreparedStatement` to guard against SQL injection.<br>• ACID Transactions with `conn.setAutoCommit(false)`, `conn.commit()`, and `conn.rollback()` in `JdbcJournalRepository.java`. |

---

### Part B: Java Web Based Projects Marking Rubric

| Rubric Criterion | Marks | Implementation & Class Mapping in Project |
| :--- | :---: | :--- |
| **Problem Understanding & Solution Design** | **8** | • Solves the problem of ambiguous career trajectories by grounding growth in empirical, day-to-day work evidence.<br>• Modular Clean Architecture separating Models, Presentation/Views, Business Services, Concurrency, and Repositories. |
| **Core Java Concepts** | **10** | • Strong typing, records (`Models.java`), immutable data structures, encapsulation with private fields and getters/setters, static factories, string formatters, and lambda expressions. |
| **Database Integration (JDBC)** | **8** | • Native JDBC connectivity (`java.sql.Connection`, `PreparedStatement`, `ResultSet`, `Statement`).<br>• Relational table mapping with foreign keys, indexing, and transactional commit/rollback integrity. |
| **Servlets & Web Integration** | **7** | • **Jakarta Servlets**: `JournalApiServlet.java` (`@WebServlet`) implements `doGet`, `doPost`, `doDelete`.<br>• **Servlet Filters**: `AuthenticationFilter.java` (`@WebFilter`) handles CORS headers, timing, and security.<br>• **Pure Java Web View Renderers**: `com.cognitivediary.view.*` renders full HTML websites directly from Java methods (`@ResponseBody` with `MediaType.TEXT_HTML_VALUE`). |

---

## Project Structure

```
├── .gitattributes                                  # Enforces Java as the dominant language on GitHub
├── README.md                                       # Master documentation & rubric mapping
└── cognitive-diary-java/                           # Complete 100% Java Project
    ├── pom.xml                                     # Maven descriptor (Spring Boot 3, SQLite, H2, Thymeleaf)
    └── src/
        ├── main/java/com/cognitivediary/
        │   ├── CognitiveDiaryApplication.java      # Spring Boot application entry point
        │   ├── concurrency/
        │   │   └── AsyncSynthesisEngine.java       # Multithreading, ThreadPoolExecutor, Locks
        │   ├── database/
        │   │   ├── DatabaseConnectionManager.java  # Singleton JDBC Connection Manager & Migration
        │   │   └── JdbcJournalRepository.java      # JDBC Operations with PreparedStatements & Transactions
        │   ├── exception/
        │   │   ├── CognitiveDiaryException.java    # Base custom exception
        │   │   ├── DatabaseOperationException.java # JDBC error wrapper
        │   │   ├── DuplicateSubmissionException.java
        │   │   ├── EntityNotFoundException.java
        │   │   └── AiSynthesisException.java
        │   ├── gui/
        │   │   └── CognitiveDiaryDesktopGui.java   # Full Java Swing Desktop GUI (JFrame, JTable, SwingWorker)
        │   ├── model/
        │   │   ├── BaseEntity.java                 # Abstract Base Class (Inheritance & Polymorphism)
        │   │   ├── JournalEntryEntity.java         # Subclass extending BaseEntity
        │   │   ├── UserEntity.java                 # Subclass extending BaseEntity
        │   │   ├── MilestoneEntity.java            # Subclass extending BaseEntity
        │   │   └── Models.java                     # Domain record models
        │   ├── repository/
        │   │   ├── CrudRepository.java             # Generic interface (Generics & Collections)
        │   │   └── JournalRepository.java          # Interface inheritance
        │   ├── security/
        │   │   └── SecurityConfig.java             # Spring Security token filter
        │   ├── service/
        │   │   ├── JournalService.java             # Journal business logic & deduplication
        │   │   ├── CareerDiscoveryService.java     # Skill aggregation & hypothesis generator
        │   │   ├── RoadmapService.java             # Growth roadmap & milestone confirmations
        │   │   ├── AnalyticsService.java           # Energy correlation & metrics
        │   │   ├── GeminiAiService.java            # Google Gemini AI REST API integration
        │   │   └── JsonDatabaseService.java        # Atomic disk persistence cache
        │   ├── servlet/
        │   │   ├── JournalApiServlet.java          # Jakarta HttpServlet (doGet, doPost, doDelete)
        │   │   └── AuthenticationFilter.java       # Jakarta Servlet Filter
        │   └── view/
        │       ├── UiComponents.java               # Pure Java HTML layout & nav generator
        │       ├── OverviewView.java               # Dashboard view in Java
        │       ├── JournalView.java                # Reflection writing view in Java
        │       ├── ArchiveView.java                # Historical archive view in Java
        │       ├── StrengthsView.java              # Competencies catalog in Java
        │       ├── CareersView.java                # Career hypotheses view in Java
        │       ├── RoadmapView.java                # Milestones & review view in Java
        │       ├── SettingsView.java               # Settings & GDPR export view in Java
        │       └── LoginView.java                  # Sign-in view in Java
        └── test/java/com/cognitivediary/
            └── CognitiveDiaryTests.java            # JUnit integration tests
```

---

## How to Run

### Option 1: Running the Java Web Application (Spring Boot & Pure Java Views)
```bash
cd cognitive-diary-java
mvn clean package -DskipTests
mvn spring-boot:run
```
Open **`http://localhost:3000`** in your browser. All pages (Overview, Write, Archive, Strengths, Careers, Roadmap, Settings) are rendered directly by the Java view engine.

### Option 2: Running the Java Desktop GUI (Swing)
```bash
cd cognitive-diary-java
mvn compile
mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"
```
Or execute directly with standard `java`:
```bash
java -cp target/classes:$(mvn dependency:build-classpath | grep -v '\[INFO\]' | tr '\n' ':') com.cognitivediary.gui.CognitiveDiaryDesktopGui
```
The desktop Swing application window will open, with tabs for writing reflections, searching the JDBC archive table, and testing live JDBC connections.

---

## Pushing to GitHub

All changes are committed. Push them to your GitHub repository:

```bash
git push origin main
```
Due to the `.gitattributes` configuration, GitHub Linguist will recognize **Java as the primary and dominant language (~99% to 100%)** of this repository.
