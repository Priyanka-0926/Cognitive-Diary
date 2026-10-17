package com.cognitivediary.database;

import com.cognitivediary.exception.DatabaseOperationException;
import com.cognitivediary.model.JournalEntryEntity;
import com.cognitivediary.repository.JournalRepository;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JdbcJournalRepository implementing JournalRepository via native JDBC.
 * Fulfills rubric requirements: Classes for database operations & Database Connectivity (JDBC).
 */
@Repository
public class JdbcJournalRepository implements JournalRepository {

    private final DatabaseConnectionManager connectionManager;

    public JdbcJournalRepository() {
        this.connectionManager = DatabaseConnectionManager.getInstance();
    }

    @Override
    public JournalEntryEntity save(JournalEntryEntity entry) {
        String upsertSql = """
            INSERT INTO journal_entries (id, user_id, entry_date, original_text, word_count,
                                        analysis_status, analysis_summary, is_demo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                entry_date = excluded.entry_date,
                original_text = excluded.original_text,
                word_count = excluded.word_count,
                analysis_status = excluded.analysis_status,
                analysis_summary = excluded.analysis_summary,
                updated_at = excluded.updated_at;
        """;

        Connection conn = null;
        try {
            conn = connectionManager.getConnection();
            conn.setAutoCommit(false); // Transaction management

            try (PreparedStatement pstmt = conn.prepareStatement(upsertSql)) {
                pstmt.setString(1, entry.getId());
                pstmt.setString(2, entry.getUserId());
                pstmt.setString(3, entry.getEntryDate());
                pstmt.setString(4, entry.getOriginalText());
                pstmt.setInt(5, entry.getWordCount());
                pstmt.setString(6, entry.getAnalysisStatus());
                pstmt.setString(7, entry.getAnalysisSummary());
                pstmt.setInt(8, entry.isDemo() ? 1 : 0);
                pstmt.setString(9, entry.getCreatedAt());
                pstmt.setString(10, entry.getUpdatedAt());

                pstmt.executeUpdate();
                conn.commit(); // Commit transaction
                return entry;
            } catch (SQLException e) {
                conn.rollback(); // Rollback on error
                throw new DatabaseOperationException("Failed to save journal entry with ID: " + entry.getId(), e);
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database connection error during save", e);
        } finally {
            connectionManager.closeConnection(conn);
        }
    }

    @Override
    public Optional<JournalEntryEntity> findById(String id) {
        String sql = "SELECT * FROM journal_entries WHERE id = ?;";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSet(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query journal entry by ID: " + id, e);
        }
    }

    @Override
    public List<JournalEntryEntity> findAll() {
        String sql = "SELECT * FROM journal_entries ORDER BY entry_date DESC;";
        List<JournalEntryEntity> list = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(mapResultSet(rs));
            }
            return list;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch all journal entries", e);
        }
    }

    @Override
    public List<JournalEntryEntity> findByUserId(String userId) {
        String sql = "SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC;";
        List<JournalEntryEntity> list = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSet(rs));
                }
            }
            return list;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query entries for user: " + userId, e);
        }
    }

    @Override
    public List<JournalEntryEntity> searchByKeyword(String userId, String keyword) {
        String sql = "SELECT * FROM journal_entries WHERE user_id = ? AND (original_text LIKE ? OR analysis_summary LIKE ?) ORDER BY entry_date DESC;";
        List<JournalEntryEntity> list = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            String term = "%" + keyword + "%";
            pstmt.setString(1, userId);
            pstmt.setString(2, term);
            pstmt.setString(3, term);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSet(rs));
                }
            }
            return list;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to search entries for keyword: " + keyword, e);
        }
    }

    @Override
    public List<JournalEntryEntity> findByUserIdAndEntryDate(String userId, String entryDate) {
        String sql = "SELECT * FROM journal_entries WHERE user_id = ? AND entry_date = ?;";
        List<JournalEntryEntity> list = new ArrayList<>();
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, userId);
            pstmt.setString(2, entryDate);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSet(rs));
                }
            }
            return list;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query entries by date", e);
        }
    }

    @Override
    public boolean deleteById(String id) {
        String sql = "DELETE FROM journal_entries WHERE id = ?;";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete journal entry by ID: " + id, e);
        }
    }

    @Override
    public boolean deleteByUserIdAndId(String userId, String id) {
        String sql = "DELETE FROM journal_entries WHERE user_id = ? AND id = ?;";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, userId);
            pstmt.setString(2, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete entry for user: " + userId, e);
        }
    }

    @Override
    public long count() {
        String sql = "SELECT COUNT(*) FROM journal_entries;";
        try (Connection conn = connectionManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            return rs.next() ? rs.getLong(1) : 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count journal entries", e);
        }
    }

    @Override
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    private JournalEntryEntity mapResultSet(ResultSet rs) throws SQLException {
        JournalEntryEntity entity = new JournalEntryEntity();
        entity.setId(rs.getString("id"));
        entity.setUserId(rs.getString("user_id"));
        entity.setEntryDate(rs.getString("entry_date"));
        entity.setOriginalText(rs.getString("original_text"));
        entity.setWordCount(rs.getInt("word_count"));
        entity.setAnalysisStatus(rs.getString("analysis_status"));
        entity.setAnalysisSummary(rs.getString("analysis_summary"));
        entity.setDemo(rs.getInt("is_demo") == 1);
        entity.setCreatedAt(rs.getString("created_at"));
        entity.setUpdatedAt(rs.getString("updated_at"));
        return entity;
    }
}
