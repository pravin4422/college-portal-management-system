package jun_26.controller;

import jun_26.dao.UserDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@WebServlet(urlPatterns = {"/api/auth/login", "/api/auth/signup", "/api/auth/verify", "/api/auth/check-admin"})
public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final UserDAO userDAO = new UserDAO();

    // Centralized connection pooling using your DatabaseConfig variables
    private Connection getDatabaseConnection() throws Exception {
        Class.forName(jun_26.config.DatabaseConfig.DRIVER);
        return DriverManager.getConnection(
                jun_26.config.DatabaseConfig.URL,
                jun_26.config.DatabaseConfig.USER,
                jun_26.config.DatabaseConfig.PASSWORD
        );
    }


    private static final java.util.Set<String> ALLOWED_ORIGINS = new java.util.HashSet<>(java.util.Arrays.asList(
        "https://roaring-flan-4fccf4.netlify.app",
        "https://wondrous-malasada-b08493.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ));

    private void setGlobalHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request != null ? request.getHeader("Origin") : null;
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        }
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String origin = req.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
        }
        resp.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Max-Age", "3600");
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setGlobalHeaders(request, response);
        String servletPath = request.getServletPath();
        if ("/api/auth/check-admin".equals(servletPath)) {
            try (Connection conn = getDatabaseConnection();
                 PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM app_users WHERE role = 'admin'");
                 ResultSet rs = ps.executeQuery()) {
                rs.next();
                boolean adminExists = rs.getInt(1) > 0;
                response.getWriter().print("{\"adminExists\":" + adminExists + "}");
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().print("{\"adminExists\":false}");
            }
        } else {
            response.getWriter().print("{\"status\":\"running\",\"message\":\"Auth endpoint online!\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();

        // 1. FIXED: Use getServletPath() instead of getPathInfo()
        String servletPath = request.getServletPath();

        try {
            StringBuilder sb = new StringBuilder();
            String line;
            int lineCount = 0;
            try (BufferedReader reader = request.getReader()) {
                while ((line = reader.readLine()) != null && lineCount++ < 500) {
                    sb.append(line);
                }
            }
            String jsonPayload = sb.toString();

            // 2. FIXED: Check for the full explicit servlet path mapping
            if ("/api/auth/login".equals(servletPath)) {
                String email = getJsonValue(jsonPayload, "email");
                String password = getJsonValue(jsonPayload, "password");

                if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    setGlobalHeaders(request, response);
                    out.print("{\"success\":false,\"error\":\"Email and password fields are required.\"}");
                    return;
                }

                boolean isValidUser = userDAO.validateLogin(email.trim(), password.trim());

                if (isValidUser) {
                    SecureRandom secureRandom = new SecureRandom();
                    String generatedCode = String.format("%06d", secureRandom.nextInt(1000000));
                    LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

                    try (Connection conn = getDatabaseConnection();
                         PreparedStatement ps = conn.prepareStatement("UPDATE app_users SET otp_code = ?, otp_expiry = ? WHERE email = ?")) {
                        ps.setString(1, generatedCode);
                        ps.setTimestamp(2, Timestamp.valueOf(expiry));
                        ps.setString(3, email.trim());
                        ps.executeUpdate();
                    }
                    final String finalEmail = email.trim();
                    final String finalCode = generatedCode;
                    final String finalApiKey = System.getenv("BREVO_API_KEY") != null ? System.getenv("BREVO_API_KEY") : "";
                    final String finalSenderEmail = System.getenv("BREVO_SENDER_EMAIL") != null ? System.getenv("BREVO_SENDER_EMAIL") : "";

                    new Thread(() -> {
                        try {
                            if (finalApiKey.isEmpty() || finalSenderEmail.isEmpty()) {
                                System.err.println("[OTP ERROR] BREVO_API_KEY or BREVO_SENDER_EMAIL env var is not set!");
                                return;
                            }
                            String jsonBody = "{" +
                                "\"sender\":{\"email\":\"" + finalSenderEmail + "\"}," +
                                "\"to\":[{\"email\":\"" + finalEmail + "\"}]," +
                                "\"subject\":\"Your Login Verification Code\"," +
                                "\"textContent\":\"Your 6-digit OTP is: " + finalCode + ". It expires in 5 minutes.\"" +
                            "}";

                            java.net.URL url = new java.net.URL("https://api.brevo.com/v3/smtp/email");
                            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("POST");
                            conn.setRequestProperty("api-key", finalApiKey);
                            conn.setRequestProperty("Content-Type", "application/json");
                            conn.setDoOutput(true);
                            conn.getOutputStream().write(jsonBody.getBytes("UTF-8"));

                            int status = conn.getResponseCode();
                            if (status == 201) {
                                System.out.println("[OTP] Email sent successfully to: " + finalEmail);
                            } else {
                                java.io.InputStream errStream = conn.getErrorStream();
                                String errBody = "";
                                if (errStream != null) {
                                    errBody = new String(errStream.readAllBytes(), "UTF-8");
                                }
                                System.err.println("[OTP ERROR] Brevo status: " + status + " | Response: " + errBody);
                            }
                            conn.disconnect();
                        } catch (Exception e) {
                            System.err.println("[OTP ERROR] " + e.getClass().getName() + " -> " + e.getMessage());
                            e.printStackTrace();
                        }
                    }).start();

                    setGlobalHeaders(request, response);
                    out.print("{\"otpSent\":true,\"status\":\"success\",\"message\":\"Verification code sent to your email.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    setGlobalHeaders(request, response);
                    out.print("{\"success\":false,\"error\":\"Invalid email or password.\"}");
                }

            }
            // 3. FIXED: Check for the full explicit verification servlet path
            else if ("/api/auth/verify".equals(servletPath)) {
                String email = getJsonValue(jsonPayload, "email");
                String enteredCode = getJsonValue(jsonPayload, "otpCode");

                if (email == null || enteredCode == null || email.trim().isEmpty() || enteredCode.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    setGlobalHeaders(request, response);
                    out.print("{\"success\":false,\"error\":\"Email and OTP validation fields are mandatory.\"}");
                    return;
                }

                try (Connection conn = getDatabaseConnection();
                     PreparedStatement ps = conn.prepareStatement("SELECT otp_code, otp_expiry, is_first_login, role, id_no FROM app_users WHERE email = ?")
                ) {
                    ps.setString(1, email.trim());
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            String dbCode = rs.getString("otp_code");
                            Timestamp dbExpiry = rs.getTimestamp("otp_expiry");

                            if (dbCode != null && dbCode.equals(enteredCode.trim())) {
                                if (dbExpiry != null && dbExpiry.toLocalDateTime().isAfter(LocalDateTime.now())) {

                                    // 1. OPTIMIZED: We read 'is_first_login' directly from the main query 'rs' up top!
                                    int isFirstLogin = rs.getInt("is_first_login");
                                    if (rs.wasNull()) {
                                        isFirstLogin = 1; // Fallback default to 1 (New User) if database is null
                                    }
                                    String userRole = rs.getString("role");
                                    String userIdNo = rs.getString("id_no");
                                    if (userRole == null) userRole = "student";
                                    if (userIdNo == null) userIdNo = "";

                                    // 2. Clear the OTP codes out of the database AND permanently set is_first_login to 0
                                    try (PreparedStatement clearPs = conn.prepareStatement(
                                            "UPDATE app_users SET otp_code = NULL, otp_expiry = NULL, is_first_login = 0 WHERE email = ?")) {
                                        clearPs.setString(1, email.trim());
                                        clearPs.executeUpdate();
                                    }

                                    // 3. Determine flag status
                                    boolean hasProfile = (isFirstLogin == 0);

                                    // 4. Send response to React
                                    setGlobalHeaders(request, response);
                                    out.print("{\"success\":true,\"hasExistingProfile\":" + hasProfile + ",\"role\":\"" + userRole + "\",\"idNo\":\"" + userIdNo + "\",\"message\":\"Login successful! Authentication verified.\"}");

                                    // 5. FIXED: Added return to stop code execution instantly
                                    return;

                                } else {
                                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                                    setGlobalHeaders(request, response);
                                    out.print("{\"success\":false,\"error\":\"The verification code has expired.\"}");
                                }

                            } else {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                setGlobalHeaders(request, response);
                                out.print("{\"success\":false,\"error\":\"Invalid verification code.\"}");
                            }
                        } else {
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            setGlobalHeaders(request, response);
                            out.print("{\"success\":false,\"error\":\"User account record not found.\"}");
                        }
                    }
                }

        }  else if ("/api/auth/signup".equals(servletPath)) {
                String name = getJsonValue(jsonPayload, "name");
                String ageStr = getJsonValue(jsonPayload, "age");
                String email = getJsonValue(jsonPayload, "email");
                String password = getJsonValue(jsonPayload, "password");
                String role = getJsonValue(jsonPayload, "role");
                String idNo = getJsonValue(jsonPayload, "idNo");

                // 1. Validate that all required registration fields are present
                if (name == null || ageStr == null || email == null || password == null || role == null || idNo == null ||
                        name.trim().isEmpty() || ageStr.trim().isEmpty() || email.trim().isEmpty() || password.trim().isEmpty() || role.trim().isEmpty() || idNo.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\":false,\"error\":\"All fields (name, age, email, password, role, idNo) are mandatory.\"}");
                    return;
                }

                try {
                    int age = Integer.parseInt(ageStr.trim());

                    // Block duplicate admin registration
                    if ("admin".equals(role.trim())) {
                        try (Connection conn = getDatabaseConnection();
                             PreparedStatement checkPs = conn.prepareStatement("SELECT COUNT(*) FROM app_users WHERE role = 'admin'");
                             ResultSet rs = checkPs.executeQuery()) {
                            rs.next();
                            if (rs.getInt(1) > 0) {
                                response.setStatus(HttpServletResponse.SC_CONFLICT);
                                out.print("{\"success\":false,\"error\":\"An admin already exists for this school.\"}");
                                return;
                            }
                        }
                    }

                    // 2. Perform database insertion with is_first_login hardcoded to 1
                    try (Connection conn = getDatabaseConnection();
                         PreparedStatement ps = conn.prepareStatement(
                                 "INSERT INTO app_users (name, age, email, password, role, id_no, is_first_login) VALUES (?, ?, ?, ?, ?, ?, 1)")) {

                        ps.setString(1, name.trim());
                        ps.setInt(2, age);
                        ps.setString(3, email.trim());
                        ps.setString(4, password.trim());
                        ps.setString(5, role.trim());
                        ps.setString(6, idNo.trim());

                        int rowsInserted = ps.executeUpdate();

                        if (rowsInserted > 0) {
                            out.print("{\"success\":true,\"message\":\"User registration successful! Please proceed to login.\"}");
                        } else {
                            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                            out.print("{\"success\":false,\"error\":\"Failed to complete registration inside the database.\"}");
                        }
                    }
                } catch (NumberFormatException nfe) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\":false,\"error\":\"Age must be a valid numeric integer value.\"}");
                    return;
                } catch (java.sql.SQLIntegrityConstraintViolationException e) {
                    // Catches duplicate entries if 'email' is designated as a UNIQUE column in your database schema
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"success\":false,\"error\":\"An account with this email address already exists.\"}");
                    return;
                }
            }
            else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                setGlobalHeaders(request, response);
                out.print("{\"success\":false,\"error\":\"Resource path route not found.\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            setGlobalHeaders(request, response);
            out.print("{\"success\":false,\"error\":\"Server Crash: " + e.getClass().getName() + " -> " + e.getMessage() + "\"}");
        }
    }



    private String getJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) {
            pattern = "\"" + key + "\":";
            start = json.indexOf(pattern);
            if (start == -1) return null;
            int end = json.indexOf(",", start + pattern.length());
            if (end == -1) end = json.indexOf("}", start + pattern.length());
            return json.substring(start + pattern.length(), end).trim().replace("\"", "");
        }
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }
}