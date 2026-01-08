package com.jatriovijog.controller;

import com.jatriovijog.service.SupabaseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.Set;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing endpoints for managing complaints. These endpoints
 * forward incoming requests to the {@link SupabaseService} which interacts
 * directly with the Supabase REST API. All endpoints are prefixed with
 * {@code /api/complaints}.
 */
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final SupabaseService supabaseService;

    public ComplaintController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    /**
     * Retrieve all complaint records stored in Supabase.
     *
     * <p>
     * The service layer returns a {@link Mono} containing a {@code List} of
     * {@code Map<String, Object>} objects. Each map represents a single row
     * from the {@code complaints} table as returned by the Supabase REST API.
     * This method explicitly declares the generic parameters on the {@code List}
     * to avoid raw type usage and ensure type safety.
     * </p>
     *
     * @return a {@code Mono} that emits the list of complaint records
     */
    @GetMapping
    public Mono<List<Map<String, Object>>> getAllComplaints() {
        return supabaseService.getComplaints();
    }

    /**
     * Create a new complaint. The request body should contain JSON matching
     * your Supabase table definition. Fields such as category, status, thana,
     * route, busName, busNumber, imageUrl, reporterType, description and
     * createdAt are common. Extra fields will be passed through to Supabase.
     *
     * @param payload complaint data
     * @return the created complaint
     */
@PostMapping
public Mono<Map<String, Object>> createComplaint(@RequestBody Map<String, Object> payload) {

    Map<String, Object> fixed = new java.util.HashMap<>();

    // REQUIRED fields (must match DB)
    fixed.put("category", payload.get("category"));
    fixed.put("status", payload.getOrDefault("status", "new"));
    fixed.put("thana", payload.get("thana"));
    fixed.put("route", payload.get("route"));
    fixed.put("description", payload.get("description"));

    // camelCase -> snake_case
    fixed.put("bus_name", payload.get("busName"));
    fixed.put("bus_number", payload.get("busNumber"));
    fixed.put("image_url", payload.get("imageUrl"));
    fixed.put("reporter_type", payload.get("reporterType"));
    fixed.put("created_at", payload.get("createdAt"));

    // REQUIRED: user_id (you must send this from frontend or JWT)
    fixed.put("user_id", payload.getOrDefault("userId", 1));

    // ❌ IGNORE extra frontend-only fields automatically

    return supabaseService.createComplaint(fixed);
}
@PatchMapping("/{id}/status")
public Mono<Map<String, Object>> updateComplaintStatus(
        @PathVariable("id") long id,
        @RequestBody Map<String, Object> body
) {
    String status = String.valueOf(body.getOrDefault("status", "")).toLowerCase().trim();

    Set<String> allowed = Set.of("new", "working", "resolved", "fake");
    if (!allowed.contains(status)) {
        return Mono.error(new IllegalArgumentException("Invalid status. Allowed: new, working, resolved, fake"));
    }

    // Optional note support if you add SQL extra columns:
    String note = body.get("note") == null ? null : String.valueOf(body.get("note"));

    return supabaseService.updateComplaintStatus(id, status, note);
}

}

// ...other imports

