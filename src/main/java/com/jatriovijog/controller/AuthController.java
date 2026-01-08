package com.jatriovijog.controller;

import com.jatriovijog.service.SupabaseService;
import com.jatriovijog.util.JwtUtil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Simple authentication controller that allows users to sign up and log in.
 * Users are stored in the Supabase {@code users} table via the
 * {@link SupabaseService}. JWTs are generated using {@link JwtUtil}.
 */
@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final SupabaseService supabaseService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(SupabaseService supabaseService,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.supabaseService = supabaseService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Create a new user account.
     *
     * @param request map containing "name", "email", "password" and
     *                optionally "role" (defaults to "user")
     * @return success or error
     */
    @PostMapping("/signup")
    public Mono<ResponseEntity<?>> signUp(@RequestBody Map<String, String> request) {
        String name = request.getOrDefault("name", "").trim();
        String email = request.getOrDefault("email", "").trim();
        String password = request.getOrDefault("password", "");
        String role = request.getOrDefault("role", "user");

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Name, email and password are required")));
        }

        return supabaseService.getUserByEmail(email)
                .flatMap(users -> {
                    if (!users.isEmpty()) {
                        return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Email already in use")));
                    }
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("name", name);
                    payload.put("email", email);
                    payload.put("password", passwordEncoder.encode(password));
                    payload.put("role", role);
                    return supabaseService.createUser(payload)
                            .map(user -> ResponseEntity.ok().body(user));
                });
    }

    /**
     * Authenticate a user and return a JWT if credentials are valid.
     *
     * @param request map containing "email" and "password"
     * @return token and user data or error
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<?>> login(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "").trim();
        String password = request.getOrDefault("password", "");
        if (email.isEmpty() || password.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Email and password are required")));
        }
        return supabaseService.getUserByEmail(email)
                .flatMap(users -> {
                    if (users.isEmpty()) {
                        return Mono.just(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
                    }
                    Map<String, Object> user = (Map<String, Object>) users.get(0);
                    String hashed = (String) user.get("password");
                    if (!passwordEncoder.matches(password, hashed)) {
                        return Mono.just(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
                    }
                    // build minimal claims for token; embed user id and role
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("userId", user.get("id"));
                    claims.put("role", user.get("role"));
                    String token = jwtUtil.generateToken(claims, email);
                    Map<String, Object> response = new HashMap<>();
                    response.put("token", token);
                    response.put("user", user);
                    return Mono.just(ResponseEntity.ok(response));
                });
    }
}