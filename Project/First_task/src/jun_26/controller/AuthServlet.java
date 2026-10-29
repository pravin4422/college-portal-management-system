package jun_26.controller;

import jun_26.dao.UserDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
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

@WebServlet(urlPatterns = {"/api/auth/login", "/api/auth/verify", "/api/auth/signup"})
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


    private void setGlobalHeaders(HttpServletResponse response) {
        // Crucial: Change this line to your exact, unique Netlify subdomain link
        response.setHeader("Access-Control-Allow-Origin", "https://harmonious-chimera-c73500.netlify.app");

        // Crucial: Add OPTIONS here for browser preflight checks, and keep your content details
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }


    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setGlobalHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setGlobalHeaders(response);
        response.getWriter().print("{\"status\":\"running\",\"message\":\"Auth endpoint online!\"}");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setGlobalHeaders(response);
        PrintWriter out = response.getWriter();

        // 1. FIXED: Use getServletPath() instead of getPathInfo()
        String servletPath = request.getServletPath();

        try {
            StringBuilder sb = new StringBuilder();
            String line;
            try (BufferedReader reader = request.getReader()) {
                while ((line = reader.readLine()) != null) {
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
                    setGlobalHeaders(response);
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
                    String myGmailAccount = "rpravin0202@gmail.com";
                    String myAppPassword = "gzehzoyachsfkrzx";

                    java.util.Properties props = new java.util.Properties();
                    props.put("mail.smtp.host", "smtp.gmail.com");            // UPDATED: Fixed host typo
                    props.put("mail.smtp.port", "587");
                    props.put("mail.smtp.auth", "true");
                    props.put("mail.smtp.starttls.enable", "true");
                    props.put("mail.smtp.ssl.protocols", "TLSv1.2");
                    props.put("mail.smtp.ssl.trust", "smtp.gmail.com");       // UPDATED: Fixed trust typo

                    try {
                        jakarta.mail.Session mailSession = jakarta.mail.Session.getInstance(props, new jakarta.mail.Authenticator() {
                            @Override
                            protected jakarta.mail.PasswordAuthentication getPasswordAuthentication() {
                                return new jakarta.mail.PasswordAuthentication(myGmailAccount, myAppPassword);
                            }
                        });

                        mailSession.setDebug(true); // UPDATED: Added debug logging

                        jakarta.mail.internet.MimeMessage message = new jakarta.mail.internet.MimeMessage(mailSession);
                        message.setFrom(new jakarta.mail.internet.InternetAddress(myGmailAccount));
                        message.setRecipients(jakarta.mail.Message.RecipientType.TO, jakarta.mail.internet.InternetAddress.parse(email.trim()));
                        message.setSubject("Your Login Verification Code");
                        message.setText("Your 6-digit login verification OTP code is: " + generatedCode + ". It will expire in 5 minutes.");

                        jakarta.mail.Transport.send(message);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    setGlobalHeaders(response);
                    out.print("{\"otpSent\":true,\"status\":\"success\",\"message\":\"Verification code sent to your email.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    setGlobalHeaders(response);
                    out.print("{\"success\":false,\"error\":\"Invalid email or password.\"}");
                }

            }
            // 3. FIXED: Check for the full explicit verification servlet path
            else if ("/api/auth/verify".equals(servletPath)) {
                String email = getJsonValue(jsonPayload, "email");
                String enteredCode = getJsonValue(jsonPayload, "otpCode");

                if (email == null || enteredCode == null || email.trim().isEmpty() || enteredCode.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    setGlobalHeaders(response);
                    out.print("{\"success\":false,\"error\":\"Email and OTP validation fields are mandatory.\"}");
                    return;
                }

                try (Connection conn = getDatabaseConnection();
                     PreparedStatement ps = conn.prepareStatement("SELECT otp_code, otp_expiry, is_first_login FROM app_users WHERE email = ?")
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

                                    // 2. Clear the OTP codes out of the database
                                    // 2. Clear the OTP codes out of the database AND permanently set is_first_login to 0
                                    try (PreparedStatement clearPs = conn.prepareStatement(
                                            "UPDATE app_users SET otp_code = NULL, otp_expiry = NULL, is_first_login = 0 WHERE email = ?")) {
                                        clearPs.setString(1, email.trim());
                                        clearPs.executeUpdate();
                                    }


                                    // 3. Determine flag status
                                    boolean hasProfile = (isFirstLogin == 0);

                                    // 4. Send response to React
                                    setGlobalHeaders(response);
                                    out.print("{\"success\":true,\"hasExistingProfile\":" + hasProfile + ",\"message\":\"Login successful! Authentication verified.\"}");

                                    // 5. FIXED: Added return to stop code execution instantly
                                    return;

                                } else {
                                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                                    setGlobalHeaders(response);
                                    out.print("{\"success\":false,\"error\":\"The verification code has expired.\"}");
                                }

                            } else {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                setGlobalHeaders(response);
                                out.print("{\"success\":false,\"error\":\"Invalid verification code.\"}");
                            }
                        } else {
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            setGlobalHeaders(response);
                            out.print("{\"success\":false,\"error\":\"User account record not found.\"}");
                        }
                    }
                }

        }  else if ("/api/auth/signup".equals(servletPath)) {
                String name = getJsonValue(jsonPayload, "name");
                String ageStr = getJsonValue(jsonPayload, "age");
                String email = getJsonValue(jsonPayload, "email");
                String password = getJsonValue(jsonPayload, "password");

                // 1. Validate that all required registration fields are present
                if (name == null || ageStr == null || email == null || password == null ||
                        name.trim().isEmpty() || ageStr.trim().isEmpty() || email.trim().isEmpty() || password.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\":false,\"error\":\"All fields (name, age, email, password) are mandatory.\"}");
                    return;
                }

                try {
                    int age = Integer.parseInt(ageStr.trim());

                    // 2. Perform database insertion with is_first_login hardcoded to 1
                    try (Connection conn = getDatabaseConnection();
                         PreparedStatement ps = conn.prepareStatement(
                                 "INSERT INTO app_users (name, age, email, password, is_first_login) VALUES (?, ?, ?, ?, 1)")) {

                        ps.setString(1, name.trim());
                        ps.setInt(2, age);
                        ps.setString(3, email.trim());
                        ps.setString(4, password.trim()); // Note: In production, consider hashing this password first!

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
                setGlobalHeaders(response);
                out.print("{\"success\":false,\"error\":\"Resource path route not found.\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            setGlobalHeaders(response);
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