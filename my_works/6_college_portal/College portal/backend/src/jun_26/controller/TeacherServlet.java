package jun_26.controller;

import jun_26.dao.TeacherDAO;
import jun_26.model.Teacher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@WebServlet("/api/teachers")
public class TeacherServlet extends HttpServlet {

    private final TeacherDAO teacherDAO = new TeacherDAO();

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

    // GET /api/teachers?email=xxx  → returns teacher JSON or {}
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();
        String email = request.getParameter("email");

        try {
            if (email == null || email.trim().isEmpty()) {
                java.util.List<Teacher> all = teacherDAO.getAllTeachers();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < all.size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append(buildJson(all.get(i)));
                }
                sb.append("]");
                out.print(sb.toString());
            } else {
                Teacher t = teacherDAO.getTeacherByEmail(email.trim());
                out.print(t != null ? buildJson(t) : "{}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // POST /api/teachers  → insert new teacher profile
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();

        try {
            String json = readBody(request);
            Teacher t = parseTeacher(json);

            if (t.getUserEmail() == null || t.getUserEmail().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\":false,\"error\":\"userEmail is required.\"}");
                return;
            }

            boolean saved = teacherDAO.saveTeacher(t);
            out.print("{\"success\":" + saved + "}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // PUT /api/teachers?email=xxx  → update existing teacher profile
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();
        String email = request.getParameter("email");

        if (email == null || email.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\":false,\"error\":\"email parameter is required.\"}");
            return;
        }

        try {
            String json = readBody(request);
            Teacher t = parseTeacher(json);
            t.setUserEmail(email.trim());

            boolean updated = teacherDAO.updateTeacher(t);
            out.print("{\"success\":" + updated + "}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // ── helpers ──────────────────────────────────────────────

    private String readBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        int count = 0;
        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null && count++ < 500) sb.append(line);
        }
        return sb.toString();
    }

    private Teacher parseTeacher(String json) {
        Teacher t = new Teacher();
        t.setUserEmail(extract(json, "userEmail"));
        t.setName(extract(json, "name"));
        t.setEmployeeId(extract(json, "employeeId"));
        t.setDob(extract(json, "dob"));
        t.setGender(extract(json, "gender"));
        t.setPhone(extract(json, "phone"));
        t.setAddress(extract(json, "address"));
        t.setQualification(extract(json, "qualification"));
        t.setExperience(extract(json, "experience"));
        t.setDepartment(extract(json, "department"));
        t.setDesignation(extract(json, "designation"));
        t.setJoinDate(extract(json, "joinDate"));
        t.setClassTeacherOf(extract(json, "classTeacherOf"));
        t.setSubjectClasses(extract(json, "subjectClasses"));
        return t;
    }

    private String extract(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\\\\\"]|\\\\.)*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1).replace("\\\"", "\"").replace("\\n", "\n").trim();
        return null;
    }

    private String buildJson(Teacher t) {
        return "{" +
            "\"id\":" + t.getId() + "," +
            "\"userEmail\":\"" + esc(t.getUserEmail()) + "\"," +
            "\"name\":\"" + esc(t.getName()) + "\"," +
            "\"employeeId\":\"" + esc(t.getEmployeeId()) + "\"," +
            "\"dob\":\"" + esc(t.getDob()) + "\"," +
            "\"gender\":\"" + esc(t.getGender()) + "\"," +
            "\"phone\":\"" + esc(t.getPhone()) + "\"," +
            "\"address\":\"" + esc(t.getAddress()) + "\"," +
            "\"qualification\":\"" + esc(t.getQualification()) + "\"," +
            "\"experience\":\"" + esc(t.getExperience()) + "\"," +
            "\"department\":\"" + esc(t.getDepartment()) + "\"," +
            "\"designation\":\"" + esc(t.getDesignation()) + "\"," +
            "\"joinDate\":\"" + esc(t.getJoinDate()) + "\"," +
            "\"classTeacherOf\":\"" + esc(t.getClassTeacherOf()) + "\"," +
            "\"subjectClasses\":\"" + esc(t.getSubjectClasses()) + "\"" +
        "}";
    }

    private String esc(String v) { return v == null ? "" : v.replace("\"", "\\\""); }
}
