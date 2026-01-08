package com.jatriovijog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SupabaseService {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAP =
            new ParameterizedTypeReference<>() {};

    private final WebClient webClient;

    public SupabaseService(@Value("${supabase.url}") String baseUrl,
                           @Value("${supabase.apikey}") String apiKey) {

        String trimmed = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String restUrl = trimmed + "/rest/v1";

        this.webClient = WebClient.builder()
                .baseUrl(restUrl)
                // ✅ Supabase requires: apikey + Authorization
                .defaultHeader("apikey", apiKey)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
    }

    // ---------- Complaints ----------

    public Mono<List<Map<String, Object>>> getComplaints() {
        return webClient.get()
                .uri("/complaints?select=*")
                .retrieve()
                .bodyToMono(LIST_OF_MAP);
    }

    public Mono<Map<String, Object>> createComplaint(Map<String, Object> payload) {
        // ✅ PostgREST returns an ARRAY when inserting. We take first item.
        return webClient.post()
                .uri("/complaints")
                .header("Prefer", "return=representation")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(LIST_OF_MAP)
                .map(list -> list.isEmpty() ? Map.of() : list.get(0));
    }

    // ---------- Emergency Reports ----------

    public Mono<List<Map<String, Object>>> getEmergencies() {
        return webClient.get()
                .uri("/emergency_reports?select=*")
                .retrieve()
                .bodyToMono(LIST_OF_MAP);
    }

    public Mono<Map<String, Object>> createEmergency(Map<String, Object> payload) {
        return webClient.post()
                .uri("/emergency_reports")
                .header("Prefer", "return=representation")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(LIST_OF_MAP)
                .map(list -> list.isEmpty() ? Map.of() : list.get(0));
    }

    // ---------- Users ----------

    public Mono<Map<String, Object>> createUser(Map<String, Object> payload) {
        return webClient.post()
                .uri("/users")
                .header("Prefer", "return=representation")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(LIST_OF_MAP)
                .map(list -> list.isEmpty() ? Map.of() : list.get(0));
    }

    public Mono<List<Map<String, Object>>> getUserByEmail(String email) {
        // If email contains special chars, safest is encoding, but for basic email it’s fine.
        String filter = "?select=*&email=eq." + email;
        return webClient.get()
                .uri("/users" + filter)
                .retrieve()
                .bodyToMono(LIST_OF_MAP);
    }


    public Mono<Map<String, Object>> updateComplaintStatus(long id, String status, String note) {
    Map<String, Object> payload = new HashMap<>();
    payload.put("status", status);

    // Optional columns (only if you add SQL below)
    if (note != null && !note.trim().isEmpty()) {
        payload.put("verification_note", note.trim());
    }

    return webClient.patch()
            .uri("/complaints?id=eq." + id)
            .header("Prefer", "return=representation")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(LIST_OF_MAP)
            .map(list -> list == null || list.isEmpty() ? Map.of() : list.get(0));
}

}
