package jun_26.dao;

import jun_26.config.DatabaseConfig;
import java.sql.*;

public class DashboardDAO {

    private Connection getConnection() throws Exception {
        Class.forName(DatabaseConfig.DRIVER);
        return DriverManager.getConnection(DatabaseConfig.URL, DatabaseConfig.USER, DatabaseConfig.PASSWORD);
    }

    // Returns stored content JSON for a given student + type, or null if not found
    public String getContent(String studentId, String dataType) throws Exception {
        String sql = "SELECT content FROM student_dashboard_data WHERE student_id = ? AND data_type = ? LIMIT 1";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            ps.setString(2, dataType);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString("content") : null;
            }
        }
    }

    // Upsert CGPA into dedicated student_cgpa table
    public void saveCgpa(String studentId, double cgpa, int totalSubjects) throws Exception {
        String sql = "INSERT INTO student_cgpa (student_id, cgpa, total_subjects) VALUES (?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE cgpa = VALUES(cgpa), total_subjects = VALUES(total_subjects)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            ps.setDouble(2, cgpa);
            ps.setInt(3, totalSubjects);
            ps.executeUpdate();
        }
    }

    // Upsert per-subject grade into dedicated student_grades table
    public void saveGrade(String studentId, String subject, String score, String maxScore, String grade) throws Exception {
        String sql = "INSERT INTO student_grades (student_id, subject, score, max_score, grade) VALUES (?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE score = VALUES(score), max_score = VALUES(max_score), grade = VALUES(grade)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            ps.setString(2, subject);
            ps.setString(3, score);
            ps.setString(4, maxScore);
            ps.setString(5, grade);
            ps.executeUpdate();
        }
    }

    // Upsert: check if row exists then UPDATE or INSERT — all on one connection
    public boolean saveContent(String studentId, String dataType, String content) throws Exception {
        String checkSql = "SELECT id FROM student_dashboard_data WHERE student_id = ? AND data_type = ? LIMIT 1";
        try (Connection conn = getConnection()) {
            boolean exists;
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                checkPs.setString(1, studentId);
                checkPs.setString(2, dataType);
                try (ResultSet rs = checkPs.executeQuery()) {
                    exists = rs.next();
                }
            }
            if (exists) {
                String updateSql = "UPDATE student_dashboard_data SET content = ?, updated_at = NOW() WHERE student_id = ? AND data_type = ?";
                try (PreparedStatement updatePs = conn.prepareStatement(updateSql)) {
                    updatePs.setString(1, content);
                    updatePs.setString(2, studentId);
                    updatePs.setString(3, dataType);
                    return updatePs.executeUpdate() > 0;
                }
            } else {
                String insertSql = "INSERT INTO student_dashboard_data (student_id, data_type, content, updated_at) VALUES (?, ?, ?, NOW())";
                try (PreparedStatement insertPs = conn.prepareStatement(insertSql)) {
                    insertPs.setString(1, studentId);
                    insertPs.setString(2, dataType);
                    insertPs.setString(3, content);
                    return insertPs.executeUpdate() > 0;
                }
            }
        }
    }
}
