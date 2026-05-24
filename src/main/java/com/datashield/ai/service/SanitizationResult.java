package com.datashield.ai.service;

import com.datashield.ai.model.DetectedDataItem;
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

    /** Pattern names detected (legacy flat list — kept for backward compat). */
    private List<String> detectedPatterns;

    /** Structured detections with position and action info (Issue #11). */
    private List<DetectedDataItem> detectedData;

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
