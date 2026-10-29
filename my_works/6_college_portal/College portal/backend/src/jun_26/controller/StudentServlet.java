package jun_26.controller;

import jun_26.dao.StudentDAO;
import jun_26.model.Student;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 2,
        maxFileSize = 1024 * 1024 * 10,
        maxRequestSize = 1024 * 1024 * 50
)
@WebServlet(urlPatterns = {"/api/students", "/api/students/files", "/api/students/*"})
public class StudentServlet extends HttpServlet {

    private final StudentDAO studentDAO = new StudentDAO();
    private String getUploadDir() {
        String realPath = getServletContext().getRealPath("/student_uploads");
        if (realPath != null) {
            File dir = new File(realPath);
            if (!dir.exists()) dir.mkdirs();
            return realPath;
        }
        return System.getProperty("catalina.home") + File.separator + "webapps" + File.separator + "ROOT" + File.separator + "student_uploads";
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
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    // Convert FormData binary text chunks back into normal Java Strings safely
    private String readPartValue(Part part) throws IOException {
        if (part == null) return null;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(part.getInputStream(), "UTF-8"))) {
            StringBuilder value = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                value.append(line);
            }
            return value.toString().trim();
        }
    }

    // Safely extract parameter data from incoming raw JSON string layers
    // Handles quoted strings (including values with commas), and unquoted primitives
    private String extractJsonValue(String json, String key) {
        // Try quoted string value first: "key":"value with, commas"
        Pattern quoted = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\\\\\"]|\\\\.)*)\"");
        Matcher m = quoted.matcher(json);
        if (m.find()) {
            return m.group(1).replace("\\\"", "\"").replace("\\n", "\n").trim();
        }
        // Fallback for unquoted primitives: "key":value
        Pattern unquoted = Pattern.compile("\"" + key + "\"\\s*:\\s*([^,\"\\}]+)");
        Matcher m2 = unquoted.matcher(json);
        if (m2.find()) {
            return m2.group(1).trim();
        }
        return null;
    }

    // Generate unique random string names to prevent file collisions on your drive
    private String getSavedFileName(Part part) {
        String contentDisp = part.getHeader("content-disposition");
        String[] tokens = contentDisp.split(";");
        for (String token : tokens) {
            if (token.trim().startsWith("filename")) {
                String originalName = token.substring(token.indexOf("=") + 2, token.length() - 1);
                return UUID.randomUUID().toString() + "_" + originalName.substring(originalName.lastIndexOf(File.separator) + 1);
            }
        }
        return UUID.randomUUID().toString();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String origin = req.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
        }
        resp.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Max-Age", "3600");
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String relativePath = request.getParameter("path");

        try {
            // File streaming — handle before setGlobalHeaders to avoid application/json corrupting binary output
            if (requestURI.contains("/files") || (relativePath != null && !requestURI.endsWith("/students"))) {
                if (relativePath != null && !relativePath.isEmpty()) {
                    String decodedPath = java.net.URLDecoder.decode(relativePath, "UTF-8");
                    String fileName = decodedPath
                            .replace("student_uploads/", "")
                            .replace("student_uploads\\", "")
                            .trim();
                    int lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
                    if (lastSlash >= 0) fileName = fileName.substring(lastSlash + 1);

                    if (fileName.isEmpty() || fileName.contains("..")) {
                        String origin0 = request.getHeader("Origin");
                        if (origin0 != null && ALLOWED_ORIGINS.contains(origin0)) {
                            response.setHeader("Access-Control-Allow-Origin", origin0);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                        } else {
                            response.setHeader("Access-Control-Allow-Origin", "*");
                        }
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        response.setContentType("application/json");
                        response.getWriter().print("{\"error\":\"Invalid file path.\"}");
                        return;
                    }

                    File file = new File(getUploadDir(), fileName);
                    if (file.exists()) {
                        String origin = request.getHeader("Origin");
                        String mimeType = getServletContext().getMimeType(file.getAbsolutePath());
                        if (mimeType == null) mimeType = "application/octet-stream";
                        response.setContentType(mimeType);
                        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                            response.setHeader("Access-Control-Allow-Origin", origin);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                        } else {
                            response.setHeader("Access-Control-Allow-Origin", "*");
                        }
                        response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length,Content-Type");
                        boolean isInline = mimeType.startsWith("image/") || mimeType.equals("application/pdf");
                        String cleanName = file.getName().replaceAll("^[a-f0-9\\-]+_", "");
                        response.setHeader("Content-Disposition", (isInline ? "inline" : "attachment") + "; filename=\"" + cleanName + "\"");
                        response.setContentLength((int) file.length());
                        try (FileInputStream inStream = new FileInputStream(file);
                             OutputStream outStream = response.getOutputStream()) {
                            byte[] buffer = new byte[4096];
                            int bytesRead;
                            while ((bytesRead = inStream.read(buffer)) != -1) {
                                outStream.write(buffer, 0, bytesRead);
                            }
                        }
                        return;
                    }
                }
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                String origin404 = request.getHeader("Origin");
                if (origin404 != null && ALLOWED_ORIGINS.contains(origin404)) {
                    response.setHeader("Access-Control-Allow-Origin", origin404);
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                } else {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                }
                response.setContentType("application/json");
                response.getWriter().print("{\"error\":\"File missing or path cannot be resolved on local disk server.\"}");
                return;
            }

            setGlobalHeaders(request, response);

            PrintWriter out = response.getWriter();
            String emailParam = request.getParameter("email");

            if (emailParam != null && !emailParam.trim().isEmpty()) {
                // Return single object for email lookup (frontend uses data.id)
                List<Student> list = studentDAO.getStudentsByEmail(emailParam.trim());
                if (!list.isEmpty()) {
                    Student s = list.get(0);
                    out.print(buildStudentJson(s));
                } else {
                    out.print("{}");
                }
            } else {
                // Return array for all students
                List<Student> list = studentDAO.getAllStudents();
                StringBuilder json = new StringBuilder("[");
                for (int i = 0; i < list.size(); i++) {
                    json.append(buildStudentJson(list.get(i)));
                    if (i < list.size() - 1) json.append(",");
                }
                json.append("]");
                out.print(json.toString());
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            try (PrintWriter errOut = response.getWriter()) {
                errOut.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    private String buildStudentJson(Student s) {
        return "{" +
            "\"id\":" + s.getId() + "," +
            "\"firstName\":\"" + esc(s.getFirstName()) + "\"," +
            "\"email\":\"" + esc(s.getUserEmail()) + "\"," +
            "\"dob\":\"" + esc(s.getDob()) + "\"," +
            "\"gender\":\"" + esc(s.getGender()) + "\"," +
            "\"classStudying\":\"" + esc(s.getClassStudying()) + "\"," +
            "\"bloodType\":\"" + esc(s.getBloodType()) + "\"," +
            "\"address\":\"" + escAddr(s.getAddress()) + "\"," +
            "\"guardianName\":\"" + esc(s.getGuardianName()) + "\"," +
            "\"guardianPhone\":\"" + esc(s.getGuardianPhone()) + "\"," +
            "\"guardianEmail\":\"" + esc(s.getGuardianEmail()) + "\"," +
            "\"userEmail\":\"" + esc(s.getUserEmail()) + "\"," +
            "\"studentIdDocPath\":\"" + esc(s.getStudentIdDocPath()) + "\"," +
            "\"recentPhotoPath\":\"" + esc(s.getRecentPhotoPath()) + "\"," +
            "\"rollNumber\":\"" + esc(s.getRollNumber()) + "\"" +
        "}";
    }

    private String esc(String v) { return v == null ? "" : v.replace("\"", "\\\""); }
    private String escAddr(String v) { return v == null ? "" : v.replace("\"", "\\\"").replace("\n", "\\n"); }

    // 2. POST HANDLER: Captures React FormData multi-part entries and streams files to disk
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();

        try {
            String firstName = readPartValue(request.getPart("firstName"));
            String dob = readPartValue(request.getPart("dob"));
            String gender = readPartValue(request.getPart("gender"));
            String classStudying = readPartValue(request.getPart("classStudying"));
            String bloodType = readPartValue(request.getPart("bloodType"));
            String address = readPartValue(request.getPart("address"));
            String guardianName = readPartValue(request.getPart("guardianName"));
            String guardianPhone = readPartValue(request.getPart("guardianPhone"));
            String guardianEmail = readPartValue(request.getPart("guardianEmail"));

            File uploadFolder = new File(getUploadDir());
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            Part docPart = request.getPart("studentIdDoc");
            Part photoPart = request.getPart("recentPhoto");

            if (firstName == null || dob == null || docPart == null || photoPart == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\":false,\"error\":\"Required form fields are missing.\"}");
                return;
            }

            String docFileName = getSavedFileName(docPart);
            String photoFileName = getSavedFileName(photoPart);

            docPart.write(getUploadDir() + File.separator + docFileName);
            photoPart.write(getUploadDir() + File.separator + photoFileName);

            String userEmail = readPartValue(request.getPart("userEmail"));

            Student student = new Student(
                    firstName, dob, gender, classStudying, bloodType, address,
                    guardianName, guardianPhone, guardianEmail,
                    "student_uploads/" + docFileName, "student_uploads/" + photoFileName
            );
            student.setUserEmail(userEmail != null ? userEmail.trim() : null);

            boolean isSaved = studentDAO.saveStudent(student);

            if (isSaved && userEmail != null && !userEmail.isEmpty()) {
                try {
                    Class.forName(jun_26.config.DatabaseConfig.DRIVER);
                } catch (ClassNotFoundException ignored) {}
                try (java.sql.Connection conn = java.sql.DriverManager.getConnection(
                        jun_26.config.DatabaseConfig.URL,
                        jun_26.config.DatabaseConfig.USER,
                        jun_26.config.DatabaseConfig.PASSWORD);
                     java.sql.PreparedStatement ps = conn.prepareStatement(
                             "UPDATE app_users SET is_first_login = 0 WHERE email = ?")) {
                    ps.setString(1, userEmail.trim());
                    ps.executeUpdate();
                }
            }
            out.print("{\"success\":" + isSaved + "}");

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // 3. PUT HANDLER: Modifies inline user profile configurations from React layout changes
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();
        String idStr = request.getParameter("id");

        if (idStr == null || idStr.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\":false,\"error\":\"Missing id parameter.\"}");
            return;
        }

        try {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            int lineCount = 0;
            while ((line = reader.readLine()) != null && lineCount++ < 500) {
                sb.append(line);
            }
            String jsonString = sb.toString();

            Student s = new Student();
            s.setId(Integer.parseInt(idStr));
            s.setFirstName(extractJsonValue(jsonString, "firstName"));
            s.setClassStudying(extractJsonValue(jsonString, "classStudying"));
            s.setDob(extractJsonValue(jsonString, "dob"));
            s.setGender(extractJsonValue(jsonString, "gender"));
            s.setBloodType(extractJsonValue(jsonString, "bloodType"));
            s.setAddress(extractJsonValue(jsonString, "address"));
            s.setGuardianName(extractJsonValue(jsonString, "guardianName"));
            s.setGuardianPhone(extractJsonValue(jsonString, "guardianPhone"));
            s.setGuardianEmail(extractJsonValue(jsonString, "guardianEmail"));
            s.setRollNumber(extractJsonValue(jsonString, "rollNumber"));

            boolean isUpdated = studentDAO.updateStudent(s);
            out.print("{\"success\":" + isUpdated + "}");

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // 4. DELETE HANDLER: Permanently removes selected record identifiers completely out of MySQL
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(request, response);
        PrintWriter out = response.getWriter();
        String idStr = request.getParameter("id");

        if (idStr == null || idStr.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\":false,\"error\":\"Missing id parameter.\"}");
            return;
        }

        try {
            boolean isDeleted = studentDAO.deleteStudent(Integer.parseInt(idStr));
            out.print("{\"success\":" + isDeleted + "}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
