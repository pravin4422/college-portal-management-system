package jun_26.dao;

import jun_26.config.DatabaseConfig;
import jun_26.model.Teacher;
import java.sql.*;

public class TeacherDAO {

    private Connection getConnection() throws Exception {
        Class.forName(DatabaseConfig.DRIVER);
        return DriverManager.getConnection(DatabaseConfig.URL, DatabaseConfig.USER, DatabaseConfig.PASSWORD);
    }

    public java.util.List<Teacher> getAllTeachers() throws Exception {
        String sql = "SELECT * FROM teachers";
        java.util.List<Teacher> list = new java.util.ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    public Teacher getTeacherByEmail(String email) throws Exception {
        String sql = "SELECT * FROM teachers WHERE user_email = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public boolean saveTeacher(Teacher t) throws Exception {
        String sql = "INSERT INTO teachers (user_email, name, employee_id, dob, gender, phone, address, " +
                "qualification, experience, department, designation, join_date, class_teacher_of, subject_classes) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            setParams(stmt, t);
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean updateTeacher(Teacher t) throws Exception {
        String sql = "UPDATE teachers SET name=?, employee_id=?, dob=?, gender=?, phone=?, address=?, " +
                "qualification=?, experience=?, department=?, designation=?, join_date=?, " +
                "class_teacher_of=?, subject_classes=? WHERE user_email=?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, t.getName());
            stmt.setString(2, t.getEmployeeId());
            stmt.setString(3, t.getDob());
            stmt.setString(4, t.getGender());
            stmt.setString(5, t.getPhone());
            stmt.setString(6, t.getAddress());
            stmt.setString(7, t.getQualification());
            stmt.setString(8, t.getExperience());
            stmt.setString(9, t.getDepartment());
            stmt.setString(10, t.getDesignation());
            stmt.setString(11, t.getJoinDate());
            stmt.setString(12, t.getClassTeacherOf());
            stmt.setString(13, t.getSubjectClasses());
            stmt.setString(14, t.getUserEmail());
            return stmt.executeUpdate() > 0;
        }
    }

    // Used by saveTeacher INSERT
    private void setParams(PreparedStatement stmt, Teacher t) throws Exception {
        stmt.setString(1, t.getUserEmail());
        stmt.setString(2, t.getName());
        stmt.setString(3, t.getEmployeeId());
        stmt.setString(4, t.getDob());
        stmt.setString(5, t.getGender());
        stmt.setString(6, t.getPhone());
        stmt.setString(7, t.getAddress());
        stmt.setString(8, t.getQualification());
        stmt.setString(9, t.getExperience());
        stmt.setString(10, t.getDepartment());
        stmt.setString(11, t.getDesignation());
        stmt.setString(12, t.getJoinDate());
        stmt.setString(13, t.getClassTeacherOf());
        stmt.setString(14, t.getSubjectClasses());
    }

    private Teacher mapRow(ResultSet rs) throws Exception {
        Teacher t = new Teacher();
        t.setId(rs.getInt("id"));
        t.setUserEmail(rs.getString("user_email"));
        t.setName(rs.getString("name"));
        t.setEmployeeId(rs.getString("employee_id"));
        t.setDob(rs.getString("dob"));
        t.setGender(rs.getString("gender"));
        t.setPhone(rs.getString("phone"));
        t.setAddress(rs.getString("address"));
        t.setQualification(rs.getString("qualification"));
        t.setExperience(rs.getString("experience"));
        t.setDepartment(rs.getString("department"));
        t.setDesignation(rs.getString("designation"));
        t.setJoinDate(rs.getString("join_date"));
        t.setClassTeacherOf(rs.getString("class_teacher_of"));
        t.setSubjectClasses(rs.getString("subject_classes"));
        return t;
    }
}
