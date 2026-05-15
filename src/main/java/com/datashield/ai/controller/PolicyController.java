package com.datashield.ai.controller;

import com.datashield.ai.model.Policy;
import com.datashield.ai.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
