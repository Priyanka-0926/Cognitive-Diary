package com.cognitivediary.database;

import com.cognitivediary.exception.DatabaseOperationException;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * DatabaseConnectionManager implementing Singleton pattern for JDBC connectivity.
 * Demonstrates thread-safe JDBC connection handling and schema initialization.
 */
public class DatabaseConnectionManager {

    private static volatile DatabaseConnectionManager instance;
    private final String jdbcUrl;

    private DatabaseConnectionManager() {
        // Embedded SQLite database for zero-config relational persistence
        this.jdbcUrl = "jdbc:sqlite:data/cognitive_diary.db";
        initDatabase();
    }

    public static DatabaseConnectionManager getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnectionManager.class) {
                if (instance == null) {
                    instance = new DatabaseConnectionManager();
                }
            }
        }
        return instance;
    }

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(jdbcUrl);
    }

    private void initDatabase() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            // Enable WAL mode for high concurrency
            try {
                stmt.execute("PRAGMA journal_mode=WAL;");
            } catch (Exception ignored) {}

            // Create users table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    display_name TEXT NOT NULL,
                    timezone TEXT DEFAULT 'UTC',
                    weekly_hours_budget INTEGER DEFAULT 5,
                    is_demo INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """);

            // Create journal_entries table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS journal_entries (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    entry_date TEXT NOT NULL,
                    original_text TEXT NOT NULL,
                    word_count INTEGER DEFAULT 0,
                    analysis_status TEXT DEFAULT 'saved',
                    analysis_summary TEXT,
                    is_demo INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            // Create index on user_id and entry_date
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_entries_user_date ON journal_entries(user_id, entry_date);");

        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to initialize JDBC database schema", e);
        }
    }

    public void closeConnection(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                System.err.println("Failed to close JDBC connection: " + e.getMessage());
            }
        }
    }
}
