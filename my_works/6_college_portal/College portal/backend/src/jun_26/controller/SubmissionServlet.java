package jun_26.controller;

import jun_26.dao.SubmissionDAO;
import jun_26.model.Submission;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.*;
import java.util.List;
import java.util.UUID;

@MultipartConfig(
    fileSizeThreshold = 1024 * 1024 * 2,
    maxFileSize       = 1024 * 1024 * 20,
    maxRequestSize    = 1024 * 1024 * 50
)
@WebServlet(urlPatterns = {"/api/submissions", "/api/submissions/file", "/api/submissions/*"})
public class SubmissionServlet extends HttpServlet {

    private final SubmissionDAO dao = new SubmissionDAO();

    private String getUploadDir() {
        String realPath = getServletContext().getRealPath("/submission_uploads");
        if (realPath != null) {
            File dir = new File(realPath);
            if (!dir.exists()) dir.mkdirs();
            return realPath;
        }
        return System.getProperty("catalina.home") + File.separator + "webapps"
                + File.separator + "ROOT" + File.separator + "submission_uploads";
    }

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
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    private String readPart(Part part) throws IOException {
        if (part == null) return null;
        try (BufferedReader r = new BufferedReader(new InputStreamReader(part.getInputStream(), "UTF-8"))) {
            StringBuilder sb = new StringBuilder(); String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return sb.toString().trim();
        }
    }

    private String savedFileName(Part part) {
        String cd = part.getHeader("content-disposition");
        for (String token : cd.split(";")) {
            if (token.trim().startsWith("filename")) {
                String orig = token.substring(token.indexOf("=") + 2, token.length() - 1);
                String name = orig.substring(orig.lastIndexOf(File.separator) + 1);
                return UUID.randomUUID() + "_" + name;
            }
        }
        return UUID.randomUUID().toString();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        String origin = req.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "3600");
        res.setStatus(200);
    }

    // GET /api/submissions?studentId=X  or  GET /api/submissions (teacher - all)
    // GET /api/submissions/file?path=...  (stream file)
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        String uri = req.getRequestURI();
        String path = req.getParameter("path");

        // Stream file — handle before setCors to avoid setting application/json content-type
        if (uri.contains("/file") || (path != null && !uri.endsWith("/submissions"))) {
            String origin = req.getHeader("Origin");
            if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Credentials", "true");
            } else {
                res.setHeader("Access-Control-Allow-Origin", "*");
            }
            res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length,Content-Type");
            if (path != null) {
                String decoded = java.net.URLDecoder.decode(path, "UTF-8");
                String fileName = decoded.replaceAll(".*[/\\\\]", "").trim();
                if (fileName.isEmpty() || fileName.contains("..")) {
                    res.setStatus(400);
                    if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                        res.setHeader("Access-Control-Allow-Origin", origin);
                        res.setHeader("Access-Control-Allow-Credentials", "true");
                    } else {
                        res.setHeader("Access-Control-Allow-Origin", "*");
                    }
                    return;
                }
                File file = new File(getUploadDir(), fileName);
                if (file.exists()) {
                    String mime = getServletContext().getMimeType(file.getAbsolutePath());
                    if (mime == null) mime = "application/octet-stream";
                    res.setContentType(mime);
                    String cleanName = fileName.replaceAll("^[a-f0-9\\-]+_", "");
                    boolean isInline = mime.startsWith("image/") || mime.equals("application/pdf");
                    res.setHeader("Content-Disposition", (isInline ? "inline" : "attachment") + "; filename=\"" + cleanName + "\"");
                    res.setContentLength((int) file.length());
                    try (FileInputStream in = new FileInputStream(file); OutputStream out = res.getOutputStream()) {
                        byte[] buf = new byte[4096]; int n;
                        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                    }
                    return;
                }
            }
            res.setStatus(404);
            if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Credentials", "true");
            } else {
                res.setHeader("Access-Control-Allow-Origin", "*");
            }
            res.setContentType("application/json");
            res.getWriter().print("{\"error\":\"File not found\"}"); return;
        }

        setCors(req, res);

        try {
            String studentIdStr = req.getParameter("studentId");
            List<Submission> list = studentIdStr != null
                    ? dao.getByStudentId(Integer.parseInt(studentIdStr))
                    : dao.getAll();
            PrintWriter out = res.getWriter();
            out.print("[");
            for (int i = 0; i < list.size(); i++) {
                Submission s = list.get(i);
                out.print("{");
                out.print("\"id\":" + s.getId() + ",");
                out.print("\"studentId\":" + s.getStudentId() + ",");
                out.print("\"studentName\":\"" + esc(s.getStudentName()) + "\",");
                out.print("\"subject\":\"" + esc(s.getSubject()) + "\",");
                out.print("\"category\":\"" + esc(s.getCategory()) + "\",");
                out.print("\"title\":\"" + esc(s.getTitle()) + "\",");
                out.print("\"filePath\":\"" + esc(s.getFilePath()) + "\",");
                out.print("\"originalName\":\"" + esc(s.getOriginalName()) + "\",");
                out.print("\"status\":\"" + esc(s.getStatus()) + "\",");
                out.print("\"mark\":\"" + esc(s.getMark()) + "\",");
                out.print("\"remark\":\"" + esc(s.getRemark()) + "\",");
                out.print("\"uploadedAt\":\"" + esc(s.getUploadedAt()) + "\"");
                out.print("}");
                if (i < list.size() - 1) out.print(",");
            }
            out.print("]");
        } catch (Exception e) {
            res.setStatus(500); res.getWriter().print("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // POST /api/submissions  — student upload
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCors(req, res);
        PrintWriter out = res.getWriter();
        try {
            new File(getUploadDir()).mkdirs();
            Part filePart = req.getPart("file");
            if (filePart == null) { res.setStatus(400); out.print("{\"success\":false,\"error\":\"No file\"}"); return; }

            String fname = savedFileName(filePart);
            filePart.write(getUploadDir() + File.separator + fname);

            Submission s = new Submission();
            s.setStudentId(Integer.parseInt(readPart(req.getPart("studentId"))));
            s.setStudentName(readPart(req.getPart("studentName")));
            s.setSubject(readPart(req.getPart("subject")));
            s.setCategory(readPart(req.getPart("category")));
            s.setTitle(readPart(req.getPart("title")));
            s.setFilePath("submission_uploads/" + fname);
            s.setOriginalName(readPart(req.getPart("originalName")));

            out.print("{\"success\":" + dao.save(s) + "}");
        } catch (Exception e) {
            res.setStatus(500); out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // PUT /api/submissions?id=X  — teacher marks
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCors(req, res);
        PrintWriter out = res.getWriter();
        try {
            String idParam = req.getParameter("id");
            if (idParam == null) {
                String uri = req.getRequestURI();
                idParam = uri.substring(uri.lastIndexOf('/') + 1);
            }
            int id = Integer.parseInt(idParam);
            BufferedReader reader = req.getReader();
            StringBuilder sb = new StringBuilder(); String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            String json = sb.toString();

            String mark   = extract(json, "mark");
            String remark = extract(json, "remark");
            String status = extract(json, "status");

            boolean ok = dao.updateMark(id,
                mark   != null ? mark   : "",
                remark != null ? remark : "",
                status != null ? status : "seen");
            out.print("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.setStatus(500); out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // DELETE /api/submissions?id=X  or  DELETE /api/submissions/X
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCors(req, res);
        PrintWriter out = res.getWriter();
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) {
                String uri = req.getRequestURI();
                idStr = uri.substring(uri.lastIndexOf('/') + 1);
            }
            out.print("{\"success\":" + dao.delete(Integer.parseInt(idStr)) + "}");
        } catch (Exception e) {
            res.setStatus(500); out.print("{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private String esc(String v) { return v == null ? "" : v.replace("\"", "\\\"").replace("\n", "\\n"); }

    private String extract(String json, String key) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\"" + key + "\"\\s*:\\s*\"?([^,\"\\}]+)\"?").matcher(json);
        return m.find() ? m.group(1).replace("\"", "").trim() : null;
    }
}
