package com.cognitivediary.servlet;

import com.cognitivediary.model.Models.JournalEntry;
import com.cognitivediary.service.JournalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * JournalApiServlet demonstrating standard Java EE / Jakarta Servlets & Web Integration.
 * Extends HttpServlet and handles RESTful HTTP methods directly.
 */
@WebServlet(name = "JournalApiServlet", urlPatterns = {"/servlet/journal/*"})
public class JournalApiServlet extends HttpServlet {

    private final JournalService journalService;
    private final ObjectMapper mapper = new ObjectMapper();

    public JournalApiServlet(JournalService journalService) {
        this.journalService = journalService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String userId = req.getParameter("userId");
        if (userId == null || userId.trim().isEmpty()) {
            userId = "demo-persona-elena";
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            // List all entries
            List<JournalEntry> entries = journalService.getUserEntries(userId);
            resp.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(resp.getWriter(), Map.of("entries", entries));
        } else {
            // Get single entry by ID
            String entryId = pathInfo.substring(1);
            JournalEntry entry = journalService.getEntry(userId, entryId);
            if (entry != null) {
                resp.setStatus(HttpServletResponse.SC_OK);
                mapper.writeValue(resp.getWriter(), Map.of("entry", entry));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                mapper.writeValue(resp.getWriter(), Map.of("error", "Journal entry not found"));
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            Map<?, ?> body = mapper.readValue(req.getInputStream(), Map.class);
            String text = (String) body.get("originalText");
            String date = (String) body.get("entryDate");
            String userId = (String) body.get("userId");
            if (userId == null) userId = "demo-persona-elena";

            if (text == null || text.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                mapper.writeValue(resp.getWriter(), Map.of("error", "Text cannot be empty"));
                return;
            }

            JournalEntry created = journalService.createEntry(userId, text, date, false);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            mapper.writeValue(resp.getWriter(), Map.of("entry", created));

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            mapper.writeValue(resp.getWriter(), Map.of("error", e.getMessage()));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.length() > 1) {
            String entryId = pathInfo.substring(1);
            String userId = req.getParameter("userId");
            if (userId == null) userId = "demo-persona-elena";

            boolean success = journalService.deleteEntry(userId, entryId);
            if (success) {
                resp.setStatus(HttpServletResponse.SC_OK);
                mapper.writeValue(resp.getWriter(), Map.of("success", true, "deletedId", entryId));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                mapper.writeValue(resp.getWriter(), Map.of("error", "Entry not found"));
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), Map.of("error", "Entry ID missing"));
        }
    }
}
