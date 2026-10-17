# Cognitive Diary · AI Career Discovery & Reflection Platform

An evidence-based personal growth and career discovery platform that transforms everyday reflective journaling into actionable career roadmaps, natural strengths synthesis, and milestone tracking powered by Google Gemini.

---

## Editions Included in this Repository

This repository includes two complete, production-ready editions:

1. **Full-Stack React + TypeScript + Express Edition** (Root directory)
   - Vite, React 19, TypeScript, Tailwind CSS, Lucide Icons
   - Express server (`server.ts`) with disk-backed JSON persistence and Google Gemini AI integration
   - Automated test suite with 23 passing integration tests (`npm test`)

2. **100% Native Java Edition** (`cognitive-diary-java/`)
   - **Java 17/21 & Spring Boot 3**: Fully modular enterprise architecture with clean separation of concerns.
   - **Pure Java Web View Engine**: Complete server-side rendered views (`OverviewView`, `JournalView`, `ArchiveView`, `StrengthsView`, `CareersView`, `RoadmapView`, `SettingsView`, `LoginView`) with zero external HTML templates.
   - **Java Desktop GUI (Swing)**: Native desktop application (`CognitiveDiaryDesktopGui.java`) featuring multi-tab reflection management, asynchronous `SwingWorker` threads, and live table data binding.
   - **Database Connectivity (JDBC)**: Parameterized prepared statements, connection pooling, schema migrations, and manual ACID transactions (`setAutoCommit(false)`, `commit()`, `rollback()`) across SQLite and H2 databases.
   - **Multithreading & Concurrency**: Custom `ThreadPoolExecutor` with named worker threads, `ReentrantReadWriteLock` synchronization, and atomic counters (`AsyncSynthesisEngine.java`).
   - **Jakarta Servlets & Filters**: Standard Java EE `HttpServlet` (`JournalApiServlet.java`) handling REST operations and `AuthenticationFilter.java` for request filtering.
   - **Object-Oriented Design**: Polymorphic class hierarchy (`BaseEntity` extended by `JournalEntryEntity`, `UserEntity`, `MilestoneEntity`), generic interfaces (`CrudRepository<T, ID>`), and custom domain exceptions (`CognitiveDiaryException`, `DatabaseOperationException`, `DuplicateSubmissionException`, `EntityNotFoundException`).

---

## Key Features

- **Empirical Skill Extraction**: Extracts technical competencies and working habits with verbatim evidence quotes from daily journal reflections.
- **Energy Correlator**: Identifies energizing vs. draining activities to guide sustainable work choices.
- **Career Hypotheses Generator**: Synthesizes concrete target roles grounded in longitudinal reflection evidence.
- **Human-in-the-Loop Roadmap Progression**: Milestones require user confirmation when ambiguous progress or completion is detected.
- **Data Sovereignty & GDPR Compliance**: One-click complete JSON export and irreversible account wipe.
- **Deduplication & AI Resilience**: Protects against rapid repeat submissions and handles Gemini capacity backoff with exponential retries.
- **Interactive System Architecture & Concepts Hub**: Built directly into the website to inspect live JDBC connectivity, thread pool metrics, and OOP class hierarchies.

---

## Quickstart: React / Node.js Edition

```bash
# Install dependencies
npm install

# Run automated audit and integration test suite
npm test

# Run local development server (port 3000)
npm run dev
```

---

## Quickstart: 100% Java Edition

### 1. Web Application (Spring Boot & Pure Java Views)
```bash
cd cognitive-diary-java

# Build application with Maven
mvn clean package -DskipTests

# Run the Spring Boot application (port 3000)
mvn spring-boot:run
```
Access the Java web app at `http://localhost:3000`.

### 2. Desktop GUI Application (Java Swing)
```bash
cd cognitive-diary-java

# Compile and launch Desktop GUI
mvn compile
mvn exec:java -Dexec.mainClass="com.cognitivediary.gui.CognitiveDiaryDesktopGui"
```

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for real-time analysis | (Required for live AI synthesis) |
| `PORT` | HTTP port for server listener | `3000` |

---

## Pushing to Your GitHub Repository

```bash
# 1. Configure git identity (replace with your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 2. Stage and commit all files
git add .
git commit -m "feat: complete Cognitive Diary in React/TypeScript and 100% Java Edition"
git branch -M main

# 3. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 4. Push with your GitHub Personal Access Token
git push -u origin main
```
