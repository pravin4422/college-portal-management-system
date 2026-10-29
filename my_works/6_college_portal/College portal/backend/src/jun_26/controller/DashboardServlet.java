package jun_26.controller;

import jun_26.dao.DashboardDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.*;

@WebServlet("/api/dashboard-data")
public class DashboardServlet extends HttpServlet {

    private final DashboardDAO dao = new DashboardDAO();

    private static final java.util.Set<String> ALLOWED_ORIGINS = new java.util.HashSet<>(java.util.Arrays.asList(
        "https://roaring-flan-4fccf4.netlify.app",
        "https://wondrous-malasada-b08493.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ));

    private void setCors(HttpServletRequest req, HttpServletResponse res) {
        String origin = req != null ? req.getHeader("Origin") : null;
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        String origin = req.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "3600");
        res.setStatus(200);
    }

    // GET /api/dashboard-data?studentId=X&type=Y
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCors(req, res);
        PrintWriter out = res.getWriter();
        try {
            String studentId = req.getParameter("studentId");
            String type = req.getParameter("type");
            if (studentId == null || studentId.trim().isEmpty() || type == null || type.trim().isEmpty()) {
                res.setStatus(400);
                out.print("{\"error\":\"Missing studentId or type\"}");
                return;
            }
            String content = dao.getContent(studentId.trim(), type.trim());
            if (content == null) {
                out.print("{\"content\":null}");
            } else {
                out.print("{\"content\":" + content + "}");
            }
        } catch (Exception e) {
            res.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // POST /api/dashboard-data
    // Body: {"studentId":"123","type":"attendance","content":[...]}
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCors(req, res);
        PrintWriter out = res.getWriter();
        try {
            // Read full body
            BufferedReader reader = req.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            String body = sb.toString().trim();

            // Extract studentId — handles "studentId":"123" and "studentId":123
            String studentId = extractStudentId(body);
            if (studentId == null || studentId.isEmpty()) {
                res.setStatus(400);
                out.print("{\"success\":false,\"error\":\"Missing studentId\"}");
                return;
            }

            // Extract type
            String type = extractStringValue(body, "type");
            if (type == null || type.isEmpty()) {
                res.setStatus(400);
                out.print("{\"success\":false,\"error\":\"Missing type\"}");
                return;
            }

            // Extract content — find "content": and take everything after the colon
            // This handles arrays [...], objects {...}, strings "...", and null
            String contentValue = extractContent(body);
            if (contentValue == null) {
                res.setStatus(400);
                out.print("{\"success\":false,\"error\":\"Missing content\"}");
                return;
            }

            boolean ok = dao.saveContent(studentId, type, contentValue);

            // When saving GPA data, also upsert into dedicated tables
            if (ok && "gpa_calc".equals(type)) {
                try {
                    // Parse cgpa and rows from content JSON
                    // content shape: {"rows":[{"subject":"...","score":"...","max":"...","grade":"..."},...],"cgpa":8.5}
                    java.util.regex.Matcher cgpaMatcher = java.util.regex.Pattern
                        .compile("\"cgpa\"\\s*:\\s*([0-9.]+)").matcher(contentValue);
                    if (cgpaMatcher.find()) {
                        double cgpa = Double.parseDouble(cgpaMatcher.group(1));
                        // Count rows with non-empty score
                        int totalSubjects = 0;
                        java.util.regex.Matcher rowMatcher = java.util.regex.Pattern
                            .compile("\"score\"\\s*:\\s*\"([^\"]*)\"").matcher(contentValue);
                        while (rowMatcher.find()) {
                            if (!rowMatcher.group(1).isEmpty()) totalSubjects++;
                        }
                        dao.saveCgpa(studentId, cgpa, totalSubjects);
                    }
                    // Upsert each subject grade row
                    java.util.regex.Matcher subjectMatcher = java.util.regex.Pattern
                        .compile("\\{[^}]*\"subject\"\\s*:\\s*\"([^\"]+)\"[^}]*\"score\"\\s*:\\s*\"([^\"]*)\"[^}]*\"max\"\\s*:\\s*\"([^\"]*)\"[^}]*\"grade\"\\s*:\\s*\"([^\"]+)\"[^}]*\\}")
                        .matcher(contentValue);
                    while (subjectMatcher.find()) {
                        String subj  = subjectMatcher.group(1);
                        String score = subjectMatcher.group(2);
                        String max   = subjectMatcher.group(3);
                        String grade = subjectMatcher.group(4);
                        if (!subj.isEmpty() && !score.isEmpty()) {
                            dao.saveGrade(studentId, subj, score, max, grade);
                        }
                    }
                } catch (Exception ignored) {}
            }

            out.print("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.setStatus(500);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Extracts studentId which can be quoted ("123") or unquoted (123).
     */
    private String extractStudentId(String body) {
        // Try quoted first: "studentId":"value"
        java.util.regex.Matcher m = java.util.regex.Pattern
            .compile("\"studentId\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        if (m.find()) return m.group(1).trim();
        // Try unquoted: "studentId":123
        m = java.util.regex.Pattern
            .compile("\"studentId\"\\s*:\\s*(\\d+)").matcher(body);
        if (m.find()) return m.group(1).trim();
        return null;
    }

    /**
     * Extracts a simple string value for a given key: "key":"value"
     */
    private String extractStringValue(String body, String key) {
        java.util.regex.Matcher m = java.util.regex.Pattern
            .compile("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        if (m.find()) return m.group(1).trim();
        return null;
    }

    /**
     * Extracts the raw content value after "content": — handles arrays, objects, strings, null.
     * Uses bracket counting to correctly handle nested JSON.
     */
    private String extractContent(String body) {
        int keyIdx = body.indexOf("\"content\"");
        if (keyIdx == -1) return null;

        int colonIdx = body.indexOf(":", keyIdx + 9);
        if (colonIdx == -1) return null;

        // Skip whitespace after colon
        int start = colonIdx + 1;
        while (start < body.length() && Character.isWhitespace(body.charAt(start))) start++;

        if (start >= body.length()) return null;

        char first = body.charAt(start);

        // null
        if (body.startsWith("null", start)) return "null";

        // String value
        if (first == '"') {
            int end = start + 1;
            while (end < body.length()) {
                if (body.charAt(end) == '"' && body.charAt(end - 1) != '\\') break;
                end++;
            }
            return body.substring(start, end + 1);
        }

        // Array or Object — use bracket counting
        if (first == '[' || first == '{') {
            char open = first;
            char close = (open == '[') ? ']' : '}';
            int depth = 0;
            boolean inString = false;
            int end = start;
            for (int i = start; i < body.length(); i++) {
                char c = body.charAt(i);
                if (c == '"' && (i == 0 || body.charAt(i - 1) != '\\')) {
                    inString = !inString;
                }
                if (!inString) {
                    if (c == open) depth++;
                    else if (c == close) {
                        depth--;
                        if (depth == 0) { end = i; break; }
                    }
                }
            }
            return body.substring(start, end + 1);
        }

        // Boolean or number — read until comma or closing brace
        int end = start;
        while (end < body.length() && body.charAt(end) != ',' && body.charAt(end) != '}') end++;
        return body.substring(start, end).trim();
    }
}
