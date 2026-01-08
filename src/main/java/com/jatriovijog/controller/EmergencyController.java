package com.jatriovijog.controller;

import com.jatriovijog.service.SupabaseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * REST controller exposing endpoints for handling emergency reports. All
 * requests are forwarded to the {@link SupabaseService} which calls the
 * Supabase REST API. Endpoints are available under the {@code /api/emergencies}
 * base path.
 */
@RestController
@RequestMapping("/api/emergencies")
public class EmergencyController {

    private final SupabaseService supabaseService;

    public EmergencyController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    /**
     * Retrieve all emergency reports stored in Supabase.
     *
     * <p>
     * The {@link SupabaseService#getEmergencies()} method returns a reactive
     * {@code Mono} wrapping a {@code List} of {@code Map<String, Object>} representing
     * each row returned from the Supabase REST API. This controller method
     * explicitly declares the generic type parameters to avoid raw type warnings
     * and compilation errors.
     * </p>
     *
     * @return a {@code Mono} emitting a list of emergency report records
     */
    @GetMapping
    public Mono<List<Map<String, Object>>> getAllEmergencies() {
        return supabaseService.getEmergencies();
    }

    /**
     * Create a new emergency report. The payload should include fields
     * describing the location (latitude, longitude, accuracy), an optional
     * audio recording URL, and any other metadata such as userId.
     *
     * @param payload emergency data
     * @return the created emergency report
     */
   @PostMapping
public Mono<Map<String, Object>> createEmergency(@Valid @RequestBody Map<String, Object> payload) {

    Map<String, Object> fixed = new java.util.HashMap<>(payload);

    if (fixed.containsKey("audioUrl")) fixed.put("audio_url", fixed.remove("audioUrl"));
    if (fixed.containsKey("createdAt")) fixed.put("created_at", fixed.remove("createdAt"));
    if (fixed.containsKey("userId")) fixed.put("user_id", fixed.remove("userId"));

    return supabaseService.createEmergency(fixed);
}

}