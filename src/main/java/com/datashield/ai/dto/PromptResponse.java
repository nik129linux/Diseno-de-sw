package com.datashield.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Prompt Response DTO
 * 
 * Returns sanitization result with blocking decision.
 * Total latency must be < 3 seconds (RNF001).
 */
@Data
@Builder
public class PromptResponse {

    /**
     * Sanitized prompt (with sensitive data masked)
     */
    private String sanitizedPrompt;

    /**
     * Whether the prompt was blocked
     */
    private boolean blocked;

    /**
     * List of reasons for blocking (e.g., "EMAIL_DETECTED", "CREDIT_CARD_DETECTED")
     */
    private List<String> reasons;

    /**
     * Total processing time in milliseconds
     */
    private long latencyMs;

    /**
     * LLM response (if not blocked and LLM call succeeded)
     */
    private String llmResponse;

    /**
     * Pattern names detected (EMAIL, CREDIT_CARD, DNI, etc.) — shown in chat UI
     */
    private List<String> detectedPatterns;
}
