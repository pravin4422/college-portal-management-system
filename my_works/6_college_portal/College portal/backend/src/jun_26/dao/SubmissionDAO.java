package jun_26.dao;

import jun_26.config.DatabaseConfig;
import jun_26.model.Submission;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SubmissionDAO {

    private Connection getConnection() throws Exception {
        Class.forName(DatabaseConfig.DRIVER);
        return DriverManager.getConnection(DatabaseConfig.URL, DatabaseConfig.USER, DatabaseConfig.PASSWORD);
    }

    public boolean save(Submission s) throws Exception {
        String sql = "INSERT INTO submissions (student_id, student_name, subject, category, title, file_path, original_name, status) VALUES (?,?,?,?,?,?,?,'pending')";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, s.getStudentId());
            ps.setString(2, s.getStudentName());
            ps.setString(3, s.getSubject());
            ps.setString(4, s.getCategory());
            ps.setString(5, s.getTitle());
            ps.setString(6, s.getFilePath());
            ps.setString(7, s.getOriginalName());
            return ps.executeUpdate() > 0;
        }
    }

    public List<Submission> getByStudentId(int studentId) throws Exception {
        List<Submission> list = new ArrayList<>();
        String sql = "SELECT * FROM submissions WHERE student_id = ? ORDER BY id DESC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(map(rs));
        }
        return list;
    }

    public List<Submission> getAll() throws Exception {
        List<Submission> list = new ArrayList<>();
        String sql = "SELECT * FROM submissions ORDER BY id DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        }
        return list;
    }

    public boolean delete(int id) throws Exception {
        String sql = "DELETE FROM submissions WHERE id = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateStatus(int id, String status) throws Exception {
        String sql = "UPDATE submissions SET status = ? WHERE id = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateMark(int id, String mark, String remark, String status) throws Exception {
        String sql = "UPDATE submissions SET mark = ?, remark = ?, status = ? WHERE id = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, mark);
            ps.setString(2, remark);
            ps.setString(3, status);
            ps.setInt(4, id);
            return ps.executeUpdate() > 0;
        }
    }

    private Submission map(ResultSet rs) throws Exception {
        Submission s = new Submission();
        s.setId(rs.getInt("id"));
        s.setStudentId(rs.getInt("student_id"));
        s.setStudentName(rs.getString("student_name"));
        s.setSubject(rs.getString("subject"));
        s.setCategory(rs.getString("category"));
        s.setTitle(rs.getString("title"));
        s.setFilePath(rs.getString("file_path"));
        s.setOriginalName(rs.getString("original_name"));
        s.setStatus(rs.getString("status"));
        s.setMark(rs.getString("mark"));
        s.setRemark(rs.getString("remark"));
        s.setUploadedAt(rs.getString("uploaded_at"));
        return s;
    }
}
