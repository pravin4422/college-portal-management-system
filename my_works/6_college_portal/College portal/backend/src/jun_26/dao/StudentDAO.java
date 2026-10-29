package jun_26.dao;

import jun_26.config.DatabaseConfig;
import jun_26.model.Student;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class StudentDAO {

    private Connection getConnection() throws Exception {
        Class.forName(DatabaseConfig.DRIVER);
        return DriverManager.getConnection(DatabaseConfig.URL, DatabaseConfig.USER, DatabaseConfig.PASSWORD);
    }

    public boolean saveStudent(Student student) throws Exception {
        String sql = "INSERT INTO students (first_name, dob, gender, class_studying, blood_type, " +
                "address, guardian_name, guardian_phone, guardian_email, " +
                "student_id_doc_path, recent_photo_path, user_email, roll_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, student.getFirstName());
            stmt.setString(2, student.getDob());
            stmt.setString(3, student.getGender());
            stmt.setString(4, student.getClassStudying());
            stmt.setString(5, student.getBloodType());
            stmt.setString(6, student.getAddress());
            stmt.setString(7, student.getGuardianName());
            stmt.setString(8, student.getGuardianPhone());
            stmt.setString(9, student.getGuardianEmail());
            stmt.setString(10, student.getStudentIdDocPath());
            stmt.setString(11, student.getRecentPhotoPath());
            stmt.setString(12, student.getUserEmail());
            stmt.setString(13, student.getRollNumber());
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Student> getStudentsByEmail(String email) throws Exception {
        List<Student> list = new ArrayList<>();
        String sql = "SELECT * FROM students WHERE user_email = ? ORDER BY id DESC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Student s = new Student(
                            rs.getString("first_name"), rs.getString("dob"), rs.getString("gender"),
                            rs.getString("class_studying"), rs.getString("blood_type"), rs.getString("address"),
                            rs.getString("guardian_name"), rs.getString("guardian_phone"), rs.getString("guardian_email"),
                            rs.getString("student_id_doc_path"), rs.getString("recent_photo_path")
                    );
                    s.setId(rs.getInt("id"));
                    s.setUserEmail(rs.getString("user_email"));
                    s.setRollNumber(rs.getString("roll_number"));
                    list.add(s);
                }
            }
        }
        return list;
    }

    // NEW METHOD: Get All Records
    public List<Student> getAllStudents() throws Exception {
        List<Student> list = new ArrayList<>();
        String sql = "SELECT * FROM students ORDER BY id DESC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Student s = new Student(
                        rs.getString("first_name"), rs.getString("dob"), rs.getString("gender"),
                        rs.getString("class_studying"), rs.getString("blood_type"), rs.getString("address"),
                        rs.getString("guardian_name"), rs.getString("guardian_phone"), rs.getString("guardian_email"),
                        rs.getString("student_id_doc_path"), rs.getString("recent_photo_path")
                );
                s.setId(rs.getInt("id"));
                s.setUserEmail(rs.getString("user_email"));
                s.setRollNumber(rs.getString("roll_number"));
                list.add(s);
            }
        }
        return list;
    }

    // NEW METHOD: Update Specific Record
    public boolean updateStudent(Student s) throws Exception {
        String sql = "UPDATE students SET first_name=?, dob=?, gender=?, class_studying=?, blood_type=?, " +
                "address=?, guardian_name=?, guardian_phone=?, guardian_email=?, roll_number=? WHERE id=?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, s.getFirstName());
            stmt.setString(2, s.getDob());
            stmt.setString(3, s.getGender());
            stmt.setString(4, s.getClassStudying());
            stmt.setString(5, s.getBloodType());
            stmt.setString(6, s.getAddress());
            stmt.setString(7, s.getGuardianName());
            stmt.setString(8, s.getGuardianPhone());
            stmt.setString(9, s.getGuardianEmail());
            stmt.setString(10, s.getRollNumber());
            stmt.setInt(11, s.getId());
            return stmt.executeUpdate() > 0;
        }
    }

    // NEW METHOD: Delete Specific Record
    public boolean deleteStudent(int id) throws Exception {
        String sql = "DELETE FROM students WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
}
