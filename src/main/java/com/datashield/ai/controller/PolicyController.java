package com.datashield.ai.controller;

import com.datashield.ai.model.Policy;
import com.datashield.ai.service.LlmConfigService;
import com.datashield.ai.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Policy Controller
 * 
 * Admin endpoints for managing DLP policies.
 */
@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService policyService;
    private final LlmConfigService llmConfigService;

    /**
     * Get all enabled policies
     */
    @GetMapping
    public ResponseEntity<List<Policy>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getEnabledPolicies());
    }

    /**
     * Get policy by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Policy> getPolicy(@PathVariable String id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    /**
     * Create new policy
     */
    @PostMapping
    public ResponseEntity<Policy> createPolicy(
            @Valid @RequestBody Policy policy,
            @AuthenticationPrincipal UserDetails userDetails) {
        Policy created = policyService.createPolicy(policy, userDetails.getUsername());
        return ResponseEntity.ok(created);
    }

    /**
     * Update policy
     */
    @PutMapping("/{id}")
    public ResponseEntity<Policy> updatePolicy(
            @PathVariable String id,
            @Valid @RequestBody Policy policy) {
        return ResponseEntity.ok(policyService.updatePolicy(id, policy));
    }

    /**
     * Delete policy
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(@PathVariable String id) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }

    // ── LLM Connection Configuration (Issue #15) ──────────────────────────────

    /**
     * GET /api/v1/policies/llm-config
     * Returns current LLM connection config with masked API key.
     */
    @GetMapping("/llm-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getLlmConfig() {
        return ResponseEntity.ok(llmConfigService.getMasked());
    }

    /**
     * PUT /api/v1/policies/llm-config
     * Updates LLM connection settings. Changes apply within 30s without restart.
     * Body: { baseUrl, model, apiKey (optional), timeoutSeconds }
     */
    @PutMapping("/llm-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateLlmConfig(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        llmConfigService.update(
                (String) body.get("baseUrl"),
                (String) body.get("model"),
                (String) body.get("apiKey"),
                body.get("timeoutSeconds") != null ? ((Number) body.get("timeoutSeconds")).intValue() : 0,
                userDetails.getUsername());

        return ResponseEntity.ok(llmConfigService.getMasked());
    }
}
