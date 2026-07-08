package jun_26.dao;

import jun_26.config.DatabaseConfig;
import jun_26.model.User;
import java.sql.*;

public class UserDAO {

    private Connection getConnection() throws Exception {
        Class.forName(DatabaseConfig.DRIVER);
        return DriverManager.getConnection(DatabaseConfig.URL, DatabaseConfig.USER, DatabaseConfig.PASSWORD);
    }

    // Signup data insertion execution routine
    public boolean registerUser(User user) throws Exception {
        String sql = "INSERT INTO app_users (name, age, email, password) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getName());
            stmt.setInt(2, user.getAge());
            stmt.setString(3, user.getEmail());
            stmt.setString(4, user.getPassword());
            return stmt.executeUpdate() > 0;
        }
    }

    // Login matching execution routine
    public boolean validateLogin(String email, String password) throws Exception {
        String sql = "SELECT id FROM app_users WHERE email = ? AND password = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            stmt.setString(2, password);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
