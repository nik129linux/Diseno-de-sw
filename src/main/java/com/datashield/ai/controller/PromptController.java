package com.datashield.ai.controller;

import com.datashield.ai.dto.PromptRequest;
import com.datashield.ai.dto.PromptResponse;
import com.datashield.ai.integration.LlmService;
import com.datashield.ai.model.Interaction;
import com.datashield.ai.model.Policy;
import com.datashield.ai.repository.InteractionRepository;
import com.datashield.ai.repository.PolicyRepository;
import com.datashield.ai.service.SanitizationResult;
import com.datashield.ai.service.SanitizationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;

/**
 * Prompt Controller
 * 
 * Main endpoint for employees to submit prompts for sanitization and LLM processing.
 * Implements RNF005: Synchronous sanitization before LLM.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/prompt")
@RequiredArgsConstructor
public class PromptController {

    private final SanitizationService sanitizationService;
    private final PolicyRepository policyRepository;
    private final InteractionRepository interactionRepository;
    private final LlmService llmService;

    /**
     * Submit prompt for sanitization and LLM processing
     * 
     * POST /api/v1/prompt
     * Body: {prompt}
     * Response: {sanitizedPrompt, blocked, reasons, latencyMs}
     * 
     * Performance: Total latency < 3 seconds (RNF001)
     * Sanitization: < 200ms (RNF005)
     */
    @PostMapping
    public ResponseEntity<PromptResponse> submitPrompt(
            @Valid @RequestBody PromptRequest request,
            Authentication authentication,
            HttpServletRequest httpServletRequest) {

        long startTime = System.currentTimeMillis();
        String userEmail = authentication.getName();

        // Get active policy
        Policy policy = policyRepository.findByEnabledTrue().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active policy found"));

        // Sanitize prompt (must complete in <200ms)
        SanitizationResult sanitizationResult = sanitizationService.sanitize(request.getPrompt(), policy);

        // Build response
        PromptResponse.PromptResponseBuilder responseBuilder = PromptResponse.builder()
                .sanitizedPrompt(sanitizationResult.getSanitizedPrompt())
                .blocked(sanitizationResult.isBlocked())
                .reasons(sanitizationResult.getBlockingReasons())
                .latencyMs(System.currentTimeMillis() - startTime);

        // If not blocked, call LLM with full conversation history
        if (!sanitizationResult.isBlocked()) {
            String llmResponse = llmService.generateCompletion(
                sanitizationResult.getSanitizedPrompt(), request.getHistory());
            responseBuilder.llmResponse(llmResponse);
        }

        PromptResponse response = responseBuilder.build();

        // Save audit log (immutable)
        saveAuditLog(userEmail, request.getPrompt(), sanitizationResult, response, httpServletRequest);

        log.info("Prompt processed for user={}: blocked={}, latency={}ms", 
                userEmail, response.isBlocked(), response.getLatencyMs());

        return ResponseEntity.ok(response);
    }

    /**
     * Save immutable audit log entry
     */
    private void saveAuditLog(String userEmail, String originalPrompt, 
                              SanitizationResult sanitizationResult, 
                              PromptResponse response,
                              HttpServletRequest request) {
        try {
            String promptHash = sha256Hash(originalPrompt);
            
            Interaction interaction = Interaction.builder()
                    .userId(userEmail) // In production, use actual user ID from database
                    .originalPromptHash(promptHash)
                    .sanitizedPrompt(response.getSanitizedPrompt())
                    .llmResponse(response.getLlmResponse())
                    .blocked(response.isBlocked())
                    .blockedReasons(response.getReasons())
                    .processingTimeMs((int) response.getLatencyMs())
                    .timestamp(Instant.now())
                    .ipAddress(request.getRemoteAddr())
                    .userAgent(request.getHeader("User-Agent"))
                    .policyVersion(sanitizationResult.getPolicyVersion())
                    .build();

            interactionRepository.save(interaction);
            
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to compute prompt hash", e);
        }
    }

    /**
     * Compute SHA-256 hash of string
     */
    private String sha256Hash(String input) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
