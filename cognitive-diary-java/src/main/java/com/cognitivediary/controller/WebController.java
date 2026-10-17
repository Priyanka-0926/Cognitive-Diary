package com.cognitivediary.controller;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.CareerDiscoveryService;
import com.cognitivediary.service.GeminiAiService;
import com.cognitivediary.service.JsonDatabaseService;
import com.cognitivediary.service.RoadmapService;
import com.cognitivediary.view.*;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class WebController {

    private final JsonDatabaseService dbService;
    private final GeminiAiService aiService;
    private final CareerDiscoveryService careerService;
    private final RoadmapService roadmapService;

    public WebController(
            JsonDatabaseService dbService,
            GeminiAiService aiService,
            CareerDiscoveryService careerService,
            RoadmapService roadmapService
    ) {
        this.dbService = dbService;
        this.aiService = aiService;
        this.careerService = careerService;
        this.roadmapService = roadmapService;
    }

    private User getEffectiveUser(User authUser) {
        if (authUser != null) return authUser;
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

    @GetMapping(value = "/overview", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String overview(@AuthenticationPrincipal User user) {
        User effective = getEffectiveUser(user);
        List<JournalEntry> entries = dbService.getJournalEntries(effective.id());
        Roadmap roadmap = roadmapService.getActiveRoadmap(effective.id());
        return OverviewView.render(effective, entries, roadmap);
    }

    @GetMapping(value = "/journal", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String journal(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String id
    ) {
        User effective = getEffectiveUser(user);
        JournalEntry editing = id != null ? dbService.getJournalEntry(effective.id(), id) : null;
        return JournalView.render(effective, editing, aiService.isConfigured());
    }

    @GetMapping(value = "/archive", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String archive(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search
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

        return ArchiveView.render(effective, entries, search);
    }

    @GetMapping(value = "/strengths", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String strengths(@AuthenticationPrincipal User user) {
        User effective = getEffectiveUser(user);
        List<AggregatedSkill> skills = careerService.aggregateUserSkills(effective.id());
        return StrengthsView.render(effective, skills);
    }

    @GetMapping(value = "/careers", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String careers(@AuthenticationPrincipal User user) {
        User effective = getEffectiveUser(user);
        List<CareerHypothesis> hypotheses = careerService.getOrSynthesizeHypotheses(effective.id());
        return CareersView.render(effective, hypotheses);
    }

    @GetMapping(value = "/roadmap", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String roadmap(@AuthenticationPrincipal User user) {
        User effective = getEffectiveUser(user);
        Roadmap roadmap = roadmapService.getActiveRoadmap(effective.id());
        return RoadmapView.render(effective, roadmap);
    }

    @GetMapping(value = "/settings", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String settings(@AuthenticationPrincipal User user) {
        User effective = getEffectiveUser(user);
        return SettingsView.render(effective);
    }

    @GetMapping(value = "/login", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String login() {
        return LoginView.render();
    }
}
