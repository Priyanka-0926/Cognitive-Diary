package com.cognitivediary.controller;

import com.cognitivediary.model.Models.*;
import com.cognitivediary.service.JsonDatabaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JsonDatabaseService dbService;

    public AuthController(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    public record RegisterRequest(String displayName, String email) {}
    public record LoginRequest(String email) {}
    public record AuthResponse(User user, String token) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.email() == null || req.email().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        User existing = dbService.getUserByEmail(req.email());
        if (existing != null) {
            String token = dbService.createSession(existing.id());
            return ResponseEntity.ok(new AuthResponse(existing, token));
        }

        User newUser = new User(
                "user-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4),
                req.email().trim().toLowerCase(),
                req.displayName() != null ? req.displayName().trim() : "Reflective Writer",
                Instant.now().toString(),
                "UTC",
                false,
                new UserPreferences(true, true, 5, List.of("Architecture", "Engineering Leadership"), "hands_on"),
                false
        );

        dbService.saveUser(newUser);
        String token = dbService.createSession(newUser.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(newUser, token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.email() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        User user = dbService.getUserByEmail(req.email());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No account found with this email"));
        }
        String token = dbService.createSession(user.id());
        return ResponseEntity.ok(new AuthResponse(user, token));
    }

    @PostMapping("/demo")
    public ResponseEntity<?> demo() {
        String demoUserId = "demo-persona-elena";
        User demoUser = dbService.getUser(demoUserId);
        if (demoUser == null) {
            demoUser = new User(
                    demoUserId,
                    "elena.rostova@example.com",
                    "Elena Rostova",
                    Instant.now().toString(),
                    "UTC",
                    true,
                    new UserPreferences(true, true, 6, List.of("Staff Engineer", "Technical Architect"), "hands_on"),
                    true
            );
            dbService.saveUser(demoUser);
        }
        String token = dbService.createSession(demoUser.id());
        return ResponseEntity.ok(new AuthResponse(demoUser, token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthenticated"));
        }
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            dbService.deleteSession(authHeader.substring(7).trim());
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }
}
