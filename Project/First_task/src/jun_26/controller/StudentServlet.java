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

@WebServlet("/api/students/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 2,  // 2MB threshold
        maxFileSize = 1024 * 1024 * 10,       // 10MB maximum file size
        maxRequestSize = 1024 * 1024 * 50     // 50MB maximum request size
)
public class StudentServlet extends HttpServlet {

    private final StudentDAO studentDAO = new StudentDAO();
    private static final String UPLOAD_DIR = System.getProperty("catalina.home") + File.separator + "webapps" + File.separator + "ROOT" + File.separator + "student_uploads";

    // Setup global connection permissions for Vite frontend running on port 5174
    private void setGlobalHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "https://harmonious-chimera-c73500.netlify.app");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
    private String extractJsonValue(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\"?([^,\"}]+)\"?");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).replace("\"", "").trim();
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
        setGlobalHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(response);

        String requestURI = request.getRequestURI();
        String relativePath = request.getParameter("path");

        try {
            // Check if the request is a file streaming request
            if (requestURI.contains("/files") || relativePath != null) {
                if (relativePath != null && !relativePath.isEmpty()) {

                    // FIXED: First decode the URL parameters to turn '%2F' back into clean '/' slashes
                    String decodedPath = java.net.URLDecoder.decode(relativePath, "UTF-8");

                    // FIXED: Cleans up any variation of the directory prefix reliably
                    String fileName = decodedPath.replace("student_uploads/", "")
                            .replace("student_uploads\\", "")
                            .trim();

                    File file = new File(UPLOAD_DIR + File.separator + fileName);

                    if (file.exists()) {
                        String mimeType = getServletContext().getMimeType(file.getAbsolutePath());
                        if (mimeType != null) {
                            response.setContentType(mimeType);
                        }
                        response.setContentLength((int) file.length());

                        try (FileInputStream inStream = new FileInputStream(file);
                             OutputStream outStream = response.getOutputStream()) {
                            byte[] buffer = new byte[4096];
                            int bytesRead;
                            while ((bytesRead = inStream.read(buffer)) != -1) {
                                outStream.write(buffer, 0, bytesRead);
                            }
                        }
                        return; // Exit method immediately after successfully streaming binary file data
                    }
                }

                // If it reached here, the path parameter exists but the actual physical file is missing from C:/student_uploads/
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().print("{\"error\":\"File missing or path cannot be resolved on local disk server.\"}");
                return;
            }

            // --- Database Payload Return Loop ---
            PrintWriter out = response.getWriter();
            List<Student> list = studentDAO.getAllStudents();
            StringBuilder json = new StringBuilder();
            json.append("[");

            for (int i = 0; i < list.size(); i++) {
                Student s = list.get(i);
                json.append("{");
                json.append("\"id\":").append(s.getId()).append(",");
                json.append("\"firstName\":\"").append(s.getFirstName() != null ? s.getFirstName() : "").append("\",");
                json.append("\"dob\":\"").append(s.getDob() != null ? s.getDob() : "").append("\",");
                json.append("\"gender\":\"").append(s.getGender() != null ? s.getGender() : "").append("\",");
                json.append("\"classStudying\":\"").append(s.getClassStudying() != null ? s.getClassStudying() : "").append("\",");
                json.append("\"bloodType\":\"").append(s.getBloodType() != null ? s.getBloodType() : "").append("\",");
                json.append("\"address\":\"").append(s.getAddress() != null ? s.getAddress().replace("\n", "\\n").replace("\"", "\\\"") : "").append("\",");
                json.append("\"guardianName\":\"").append(s.getGuardianName() != null ? s.getGuardianName() : "").append("\",");
                json.append("\"guardianPhone\":\"").append(s.getGuardianPhone() != null ? s.getGuardianPhone() : "").append("\",");
                json.append("\"guardianEmail\":\"").append(s.getGuardianEmail() != null ? s.getGuardianEmail() : "").append("\",");
                json.append("\"studentIdDocPath\":\"").append(s.getStudentIdDocPath() != null ? s.getStudentIdDocPath() : "").append("\",");
                json.append("\"recentPhotoPath\":\"").append(s.getRecentPhotoPath() != null ? s.getRecentPhotoPath() : "").append("\"");
                json.append("}");

                if (i < list.size() - 1) {
                    json.append(",");
                }
            }
            json.append("]");
            out.print(json.toString());

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            try (PrintWriter errOut = response.getWriter()) {
                errOut.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }


    // 2. POST HANDLER: Captures React FormData multi-part entries and streams files to disk
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setGlobalHeaders(response);
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

            // FIXED: Standardize directory generation path using system safe separators
            File uploadFolder = new File(UPLOAD_DIR);
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

            // FIXED: Using absolute programmatic storage boundaries to place files onto C:\student_uploads\
            docPart.write(UPLOAD_DIR + File.separator + docFileName);
            photoPart.write(UPLOAD_DIR + File.separator + photoFileName);

            Student student = new Student(
                    firstName, dob, gender, classStudying, bloodType, address,
                    guardianName, guardianPhone, guardianEmail,
                    "student_uploads/" + docFileName, "student_uploads/" + photoFileName
            );

            boolean isSaved = studentDAO.saveStudent(student);
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
        setGlobalHeaders(response);
        PrintWriter out = response.getWriter();
        String idStr = request.getParameter("id");

        try {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
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
        setGlobalHeaders(response);
        PrintWriter out = response.getWriter();
        String idStr = request.getParameter("id");

        try {
            boolean isDeleted = studentDAO.deleteStudent(Integer.parseInt(idStr));
            out.print("{\"success\":" + isDeleted + "}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
