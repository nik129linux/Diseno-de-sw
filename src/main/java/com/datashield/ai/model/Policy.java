package com.datashield.ai.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

/**
 * Policy Entity - DLP Configuration
 * 
 * Defines regex patterns and actions for data sanitization.
 * Supports hot-reload for zero-downtime updates.
 */
@Data
@Builder
@Document(collection = "policies")
public class Policy {

    @Id
    private String id;

    /**
     * Policy name (indexed for quick lookup)
     */
    @Indexed
    @Field("name")
    private String name;

    /**
     * Policy description
     */
    @Field("description")
    private String description;

    /**
     * List of regex patterns for DLP detection
     */
    @Field("regexPatterns")
    private List<RegexPattern> regexPatterns;

    /**
     * Whether the policy is currently active
     */
    @Indexed
    @Field("enabled")
    private boolean enabled;

    /**
     * Creation timestamp
     */
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;

    /**
     * Last update timestamp (indexed for audit queries)
     */
    @Indexed
    @Field("updatedAt")
    private Instant updatedAt;

    /**
     * User ID who created this policy
     */
    @Field("createdBy")
    private String createdBy;

    /**
     * Regex Pattern Definition
     */
    @Data
    @Builder
    public static class RegexPattern {
        
        /**
         * Pattern name (e.g., "EMAIL", "CREDIT_CARD", "DNI")
         */
        private String name;

        /**
         * Compiled regex pattern string
         * Must be validated before storage
         */
        private String pattern;

        /**
         * Action to take when pattern matches:
         * - BLOCK: Reject the prompt entirely
         * - MASK: Replace sensitive data with placeholders
         * - WARN: Allow but log for review
         */
        private String action; // BLOCK|MASK|WARN

        /**
         * Priority order (lower = higher priority)
         */
        private int priority;

        /**
         * Whether this pattern is currently enabled
         */
        private boolean enabled;

        /**
         * False positive rate (monitored for optimization)
         */
        private Double falsePositiveRate;
    }
}
