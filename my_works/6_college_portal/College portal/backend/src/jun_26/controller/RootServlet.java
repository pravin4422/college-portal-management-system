package jun_26.controller;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;

@WebServlet(urlPatterns = {"/", "/favicon.ico"})
public class RootServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String uri = req.getRequestURI();

        if (uri.endsWith("favicon.ico")) {
            res.setStatus(204);
            return;
        }

        res.setContentType("text/html;charset=UTF-8");
        res.setStatus(200);
        try (PrintWriter out = res.getWriter()) {
            out.print("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>"
                + "<link rel='icon' href='data:,'>"
                + "<title>Student Portal API</title>"
                + "<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f2f5}"
                + ".card{background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.1);text-align:center}"
                + ".status{color:#28a745;font-size:18px;font-weight:bold}"
                + ".endpoints{text-align:left;margin-top:20px;background:#f8f9fa;padding:15px;border-radius:6px}"
                + "code{font-size:13px;color:#495057}</style></head>"
                + "<body><div class='card'><h2>Student Portal API</h2>"
                + "<p class='status'>&#10003; Server is Running</p>"
                + "<div class='endpoints'><p><strong>Available Endpoints:</strong></p>"
                + "<code>POST /api/auth/signup</code><br>"
                + "<code>POST /api/auth/login</code><br>"
                + "<code>POST /api/auth/verify</code><br>"
                + "<code>GET/POST /api/students/*</code><br>"
                + "<code>GET/POST/PUT/DELETE /api/submissions/*</code><br>"
                + "<code>GET/POST /api/dashboard-data</code>"
                + "</div></div></body></html>");
        }
    }
}
