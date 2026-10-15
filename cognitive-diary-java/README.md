# Cognitive Diary · Java Spring Boot Edition

A full enterprise Java 21 / Spring Boot 3 implementation of the **Cognitive Diary** application, faithfully mirroring the architecture, API contracts, session security, Gemini AI synthesis, and data persistence of the original TypeScript/Node.js engine.

---

## Architecture & Technology Stack

- **Language & Runtime**: Java 21 (LTS)
- **Framework**: Spring Boot 3.3.4 (`spring-boot-starter-web`, `spring-boot-starter-security`)
- **JSON Serialization**: Jackson 2.17 (`jackson-datatype-jsr310`)
- **AI Integration**: Google Gemini API via Java 21 `java.net.http.HttpClient` with structured JSON parsing and resilience handling
- **Persistence**: Atomic, disk-backed JSON engine (`data/cognitive_diary.json`) with thread-safe ConcurrentHashMap cache
- **Security**: Stateless Bearer token authentication filter (`TokenAuthFilter`) with cryptographic session validation (`cdt_*`) and strict cross-user tenant isolation
- **Frontend Compatibility**: Directly serves or proxies the Cognitive Diary React/Tailwind SPA frontend

---

## Directory Structure

```
cognitive-diary-java/
├── pom.xml                                    # Maven dependency & build descriptor
├── README.md                                  # Setup & deployment guide
└── src/
    └── main/
        ├── java/com/cognitivediary/
        │   ├── CognitiveDiaryApplication.java # Spring Boot entrypoint
        │   ├── model/
        │   │   └── Models.java                # Immutable records (User, JournalEntry, Milestone, etc.)
        │   ├── service/
        │   │   ├── JsonDatabaseService.java   # Atomic disk persistence & isolation engine
        │   │   └── GeminiAiService.java       # Google Gemini API integration
        │   ├── security/
        │   │   └── SecurityConfig.java        # Spring Security & Bearer token filter
        │   └── controller/
        │       ├── AuthController.java        # Registration, login, demo persona, logout
        │       ├── JournalController.java     # Journal CRUD, deduplication, AI retries
        │       └── AccountAndRoadmapController.java # Roadmaps, milestones, export, wipe
        └── resources/
            └── application.properties         # Server port, model selection, Gemini settings
```

---

## Running Locally

### 1. Prerequisites
- **Java Development Kit (JDK)**: Version 21 or higher
- **Maven**: Version 3.8 or higher
- **Gemini API Key**: Set in your environment via `export GEMINI_API_KEY="your_api_key"`

### 2. Build & Run
```bash
# Navigate to Java project folder
cd cognitive-diary-java

# Build application package
mvn clean package -DskipTests

# Run the Spring Boot application
mvn spring-boot:run
```
The server will boot on `http://localhost:3000`.

---

## Serving the React Frontend with Spring Boot

To serve the compiled React SPA frontend directly through Spring Boot:
1. In the root directory, run `npm run build` to compile the Vite frontend into `dist/`.
2. Copy the contents of `dist/` into `cognitive-diary-java/src/main/resources/static/`.
3. Rebuild with `mvn clean package`. Spring Boot will automatically serve `index.html` and static assets on `http://localhost:3000` while routing all `/api/*` endpoints to the Java controllers.

---

## Docker Deployment (Dockerfile)

```dockerfile
# Multi-stage build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/cognitive-diary-1.0.0.jar app.jar
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
```
