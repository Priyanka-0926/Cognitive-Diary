package com.cognitivediary.security;

import com.cognitivediary.model.Models.User;
import com.cognitivediary.service.JsonDatabaseService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JsonDatabaseService dbService;

    public SecurityConfig(JsonDatabaseService dbService) {
        this.dbService = dbService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/demo",
                                "/",
                                "/index.html",
                                "/assets/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new TokenAuthFilter(dbService), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    public static class TokenAuthFilter extends OncePerRequestFilter {
        private final JsonDatabaseService dbService;

        public TokenAuthFilter(JsonDatabaseService dbService) {
            this.dbService = dbService;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            String authHeader = request.getHeader("Authorization");
            String token = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            } else {
                String tokenHeader = request.getHeader("x-session-token");
                if (tokenHeader != null && !tokenHeader.trim().isEmpty()) {
                    token = tokenHeader.trim();
                }
            }

            if (token != null) {
                User user = dbService.getSessionUser(token);
                if (user != null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            user,
                            token,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }

            filterChain.doFilter(request, response);
        }
    }
}
