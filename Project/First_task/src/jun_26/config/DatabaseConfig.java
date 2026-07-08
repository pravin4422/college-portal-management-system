package jun_26.config;

public class DatabaseConfig {
    public static final String URL = System.getenv("DB_URL") != null ? System.getenv("DB_URL") : "jdbc:mysql://localhost:3306/school_db";
    public static final String USER = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
    public static final String PASSWORD = System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "YourPasswordHere";
    public static final String DRIVER = "com.mysql.cj.jdbc.Driver";
}
