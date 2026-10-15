package com.cognitivediary.controller;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.GeminiAiService;
import com.cognitivediary.service.JsonDatabaseService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class WebController {

    private final JsonDatabaseService dbService;
    private final GeminiAiService aiService;

    public WebController(JsonDatabaseService dbService, GeminiAiService aiService) {
        this.dbService = dbService;
        this.aiService = aiService;
    }

    private User getEffectiveUser(User authUser) {
        if (authUser != null) return authUser;
        // Default to demo user if not logged in to make browsing immediate
        User demo = dbService.getUser("demo-persona-elena");
        if (demo == null) {
            demo = new User(
                    "demo-persona-elena",
                    "elena.rostova@example.com",
                    "Elena Rostova",
                    java.time.Instant.now().toString(),
                    "UTC",
                    true,
                    new UserPreferences(true, true, 6, List.of("Staff Engineer", "Systems Architect"), "hands_on"),
                    true
            );
            dbService.saveUser(demo);
        }
        return demo;
    }

    @GetMapping("/")
    public String index() {
        return "redirect:/overview";
    }

    @GetMapping("/overview")
    public String overview(@AuthenticationPrincipal User user, Model model) {
        User effective = getEffectiveUser(user);
        List<JournalEntry> entries = dbService.getJournalEntries(effective.id());
        Roadmap roadmap = dbService.getRoadmap(effective.id());
        List<ProgressEvent> events = dbService.getProgressEvents(effective.id());

        model.addAttribute("user", effective);
        model.addAttribute("entries", entries);
        model.addAttribute("roadmap", roadmap);
        model.addAttribute("events", events);
        model.addAttribute("activeTab", "overview");
        return "overview";
    }

    @GetMapping("/journal")
    public String journal(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String id,
            Model model
    ) {
        User effective = getEffectiveUser(user);
        JournalEntry editing = id != null ? dbService.getJournalEntry(effective.id(), id) : null;

        model.addAttribute("user", effective);
        model.addAttribute("editing", editing);
        model.addAttribute("aiConfigured", aiService.isConfigured());
        model.addAttribute("activeTab", "journal");
        return "journal";
    }

    @GetMapping("/archive")
    public String archive(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            Model model
    ) {
        User effective = getEffectiveUser(user);
        List<JournalEntry> entries = dbService.getJournalEntries(effective.id());

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            entries = entries.stream()
                    .filter(e -> e.originalText().toLowerCase().contains(q) ||
                                (e.analysis() != null && e.analysis().summary().toLowerCase().contains(q)))
                    .toList();
        }

        model.addAttribute("user", effective);
        model.addAttribute("entries", entries);
        model.addAttribute("searchQuery", search != null ? search : "");
        model.addAttribute("activeTab", "archive");
        return "archive";
    }

    @GetMapping("/strengths")
    public String strengths(@AuthenticationPrincipal User user, Model model) {
        User effective = getEffectiveUser(user);
        List<JournalEntry> entries = dbService.getJournalEntries(effective.id());

        model.addAttribute("user", effective);
        model.addAttribute("entries", entries);
        model.addAttribute("activeTab", "strengths");
        return "strengths";
    }

    @GetMapping("/careers")
    public String careers(@AuthenticationPrincipal User user, Model model) {
        User effective = getEffectiveUser(user);
        List<JournalEntry> entries = dbService.getJournalEntries(effective.id());

        model.addAttribute("user", effective);
        model.addAttribute("entries", entries);
        model.addAttribute("activeTab", "careers");
        return "careers";
    }

    @GetMapping("/roadmap")
    public String roadmap(@AuthenticationPrincipal User user, Model model) {
        User effective = getEffectiveUser(user);
        Roadmap roadmap = dbService.getRoadmap(effective.id());
        List<ProgressEvent> events = dbService.getProgressEvents(effective.id());

        model.addAttribute("user", effective);
        model.addAttribute("roadmap", roadmap);
        model.addAttribute("events", events);
        model.addAttribute("activeTab", "roadmap");
        return "roadmap";
    }

    @GetMapping("/settings")
    public String settings(@AuthenticationPrincipal User user, Model model) {
        User effective = getEffectiveUser(user);
        model.addAttribute("user", effective);
        model.addAttribute("activeTab", "settings");
        return "settings";
    }

    @GetMapping("/login")
    public String login(Model model) {
        return "login";
    }
}
