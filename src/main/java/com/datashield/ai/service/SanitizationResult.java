package com.datashield.ai.service;

import com.datashield.ai.model.Policy;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Sanitization Result
 * 
 * Immutable result object returned by SanitizationService.
 * Thread-safe and side-effect free.
 */
@Data
@Builder
public class SanitizationResult {

    /**
     * Sanitized prompt with sensitive data masked or removed
     */
    private String sanitizedPrompt;

    /**
     * List of detected sensitive patterns
     */
    private List<String> detectedPatterns;

    /**
     * Whether the prompt should be blocked
     */
    private boolean blocked;

    /**
     * Reasons for blocking
     */
    private List<String> blockingReasons;

    /**
     * Processing time in milliseconds (must be < 200ms for 99% of cases)
     */
    private long processingTimeMs;

    /**
     * Policy version used for sanitization
     */
    private String policyVersion;
}
