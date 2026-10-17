# Cognitive Diary (Java Edition)

Cognitive Diary is a Java-based personal career growth and reflective journaling application. It analyzes daily work reflections to identify demonstrated strengths, track milestone progress on an adaptive roadmap, and explore evidence-grounded career hypotheses.

The project includes both a **Spring Boot web application** with server-side rendered Java views and a **native Java Swing desktop GUI**.

---

## What the Application Does

- **Overview Dashboard**: Displays reflection metrics, identified strengths, active roadmap status, and recent entries.
- **Daily Reflection Journal**: An editor for recording daily work notes with real-time word counting, coaching prompts, and instant AI skill extraction.
- **Reflection Archive**: Searchable history of past reflections with word counts, dates, and competency summaries.
- **Natural Strengths**: Catalog of technical and cognitive skills extracted from journal entries with verbatim evidence quotes and confidence ratings.
- **Career Discovery**: Career hypotheses grounded in journal evidence, providing a "Why It Fits" rationale and low-risk safe experiments.
- **Career Roadmap**: Paced progression phases with milestones. Detects accomplishments from reflections and prompts the user to confirm or reject progress.
- **System Architecture Inspector**: A live in-app dashboard showing the underlying Java OOP hierarchy, JDBC connection status, and thread pool metrics.
- **Data Sovereignty & Settings**: Allows users to download a full JSON export of their data or permanently wipe all account records.

---

## Java Architecture & Technologies Used

- **Language & Platform**: Java 17+ / Java 21
- **Framework**: Spring Boot 3.3 (`spring-boot-starter-web`, `spring-boot-starter-security`)
- **Database (JDBC)**:
  - SQLite embedded database (`jdbc:sqlite:data/cognitive_diary.db`) managed via `DatabaseConnectionManager.java` (Singleton pattern).
  - Data access through `JdbcJournalRepository.java` using parameterized `PreparedStatement` and manual transactions (`setAutoCommit(false)`, `commit()`, `rollback()`).
  - Fallback atomic JSON storage in `JsonDatabaseService.java`.
- **Object-Oriented Design (OOP)**:
  - Abstract base class `BaseEntity.java` extended by `JournalEntryEntity.java`, `UserEntity.java`, and `MilestoneEntity.java`, using method overriding (`getEntitySummary()`) for runtime polymorphism.
  - Generic interface `CrudRepository<T, ID>.java` and specialized `JournalRepository.java`.
  - Custom exception hierarchy: `CognitiveDiaryException`, `DatabaseOperationException`, `DuplicateSubmissionException`, `EntityNotFoundException`.
- **Multithreading & Concurrency**:
  - `AsyncSynthesisEngine.java`: Custom `ThreadPoolExecutor` with named worker threads (`SynthesisWorker-N`) and `ReentrantReadWriteLock` for thread-safe access.
  - `SwingWorker` threads in the desktop GUI to keep the interface responsive during database queries.
- **Servlets & Web Layer**:
  - `JournalApiServlet.java` extending `HttpServlet` with `doGet`, `doPost`, and `doDelete`.
  - `AuthenticationFilter.java` implementing `jakarta.servlet.Filter` for CORS handling and request tracking.
  - Pure Java HTML view renderers (`com.cognitivediary.view.*`) generating all web pages directly from Java without external template files.
- **Desktop GUI (Swing)**:
  - `CognitiveDiaryDesktopGui.java`: Full `JFrame` desktop application with `JTabbedPane`, `JTextArea`, and `JTable` connected directly to the JDBC repository.
- **AI Integration**:
  - `GeminiAiService.java`: Calls the Google Gemini API using native Java 21 `HttpClient` with JSON parsing and fallback error handling.

---

## Project Structure

```
cognitive-diary-java/
├── pom.xml                                      # Maven build descriptor
└── src/
    ├── main/
    │   ├── java/com/cognitivediary/
    │   │   ├── CognitiveDiaryApplication.java   # Spring Boot entry point
    │   │   ├── concurrency/
    │   │   │   └── AsyncSynthesisEngine.java    # ThreadPoolExecutor & concurrency locks
    │   │   ├── controller/
    │   │   │   ├── AuthController.java          # Authentication & session endpoints
    │   │   │   ├── JournalController.java       # Journal CRUD & AI retry endpoints
    │   │   │   ├── AccountAndRoadmapController.java # Roadmap & data export endpoints
    │   │   │   └── WebController.java           # Serves pure Java HTML views
    │   │   ├── database/
    │   │   │   ├── DatabaseConnectionManager.java # JDBC connection manager (SQLite/H2)
    │   │   │   └── JdbcJournalRepository.java   # JDBC operations with PreparedStatements
    │   │   ├── exception/
    │   │   │   ├── CognitiveDiaryException.java # Custom domain base exception
    │   │   │   ├── DatabaseOperationException.java
    │   │   │   ├── DuplicateSubmissionException.java
    │   │   │   ├── EntityNotFoundException.java
    │   │   │   └── AiSynthesisException.java
    │   │   ├── gui/
    │   │   │   └── CognitiveDiaryDesktopGui.java # Native Java Swing desktop interface
    │   │   ├── model/
    │   │   │   ├── BaseEntity.java              # Abstract base entity
    │   │   │   ├── JournalEntryEntity.java      # Subclass of BaseEntity
    │   │   │   ├── UserEntity.java              # Subclass of BaseEntity
    │   │   │   ├── MilestoneEntity.java         # Subclass of BaseEntity
    │   │   │   └── Models.java                  # Domain records
    │   │   ├── repository/
    │   │   │   ├── CrudRepository.java          # Generic repository interface
    │   │   │   └── JournalRepository.java       # Specialized repository interface
    │   │   ├── security/
    │   │   │   └── SecurityConfig.java          # Spring Security token filter
    │   │   ├── service/
    │   │   │   ├── JournalService.java          # Reflection business logic
    │   │   │   ├── CareerDiscoveryService.java  # Skill aggregation & career hypotheses
    │   │   │   ├── RoadmapService.java          # Roadmap progression & milestone reviews
    │   │   │   ├── AnalyticsService.java        # Energy balance analytics
    │   │   │   ├── GeminiAiService.java         # Gemini AI REST client (Java HttpClient)
    │   │   │   └── JsonDatabaseService.java     # Thread-safe atomic persistence
    │   │   ├── servlet/
    │   │   │   ├── JournalApiServlet.java       # Jakarta HttpServlet (GET, POST, DELETE)
    │   │   │   └── AuthenticationFilter.java    # Jakarta Servlet Filter
    │   │   └── view/
    │   │       ├── UiComponents.java            # Shared layout, header, footer in Java
    │   │       ├── OverviewView.java            # Dashboard view
    │   │       ├── JournalView.java             # Reflection editor view
    │   │       ├── ArchiveView.java             # Archive & search view
    │   │       ├── StrengthsView.java           # Strengths catalog view
    │   │       ├── CareersView.java             # Career hypotheses view
    │   │       ├── RoadmapView.java             # Career roadmap view
    │   │       ├── SettingsView.java            # Settings & GDPR export view
    │   │       ├── LoginView.java               # Sign-in & demo persona view
    │   │       └── ArchitectureView.java        # System architecture inspector view
    │   └── resources/
    │       └── application.properties           # Spring Boot server & model configuration
    └── test/
        └── java/com/cognitivediary/
            └── CognitiveDiaryTests.java         # JUnit integration test suite
```

---

## How to Run

### 1. Run the Java Web Application
```bash
cd cognitive-diary-java
mvn clean package -DskipTests
mvn spring-boot:run
```
Open **`http://localhost:3000`** in your browser.

### 2. Run the Java Desktop GUI (Swing)
```bash
cd cognitive-diary-java
mvn compile
mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"
```
A desktop window will open with tabs to write reflections, search records via JDBC, and test database connections.

### 3. Run the Unit & Integration Tests
```bash
cd cognitive-diary-java
mvn test
```

---

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for real-time skill extraction and analysis |
| `PORT` | *(Optional)* Server port (defaults to `3000`) |
