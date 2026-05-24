package com.datashield.ai.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

import com.datashield.ai.model.DetectedDataItem;

/**
 * Interaction - Audit Log Entity (IMMUTABLE, append-only)
 * 
 * Stores every interaction with the LLM for compliance and security auditing.
 * Complies with RNF009: Immutable audit logging requirement.
 * 
 * MongoDB indexes for performance:
 * - userId + timestamp (compound index for fast user history queries)
 * - blocked + timestamp (for dashboard analytics)
 * - originalPromptHash (for deduplication and lookup)
 */
@Data
@Builder
@Document(collection = "interactions")
@CompoundIndex(name = "user_timestamp_idx", def = "{'userId': 1, 'timestamp': -1}")
@CompoundIndex(name = "blocked_timestamp_idx", def = "{'blocked': 1, 'timestamp': -1}")
public class Interaction {

    @Id
    private String id;

    /** UUID sent by the client to group turns of the same conversation. */
    @Indexed
    @Field("conversationId")
    private String conversationId;

    @Indexed
    @Field("userId")
    private String userId;

    /**
     * SHA-256 hash of the original prompt (never store plain text)
     * GDPR compliance: original content is not stored, only hash for reference
     */
    @Indexed
    @Field("originalPromptHash")
    private String originalPromptHash;

    /**
     * Sanitized prompt that was sent to LLM (or would have been sent if not blocked)
     */
    @Field("sanitizedPrompt")
    private String sanitizedPrompt;

    /**
     * LLM response (optional, may be masked if contains PII)
     */
    @Field("llmResponse")
    private String llmResponse;

    /**
     * Whether the prompt was blocked due to sensitive data detection
     */
    @Indexed
    @Field("blocked")
    private boolean blocked;

    /**
     * List of reasons why the prompt was blocked (e.g., "EMAIL_DETECTED", "CREDIT_CARD_DETECTED")
     */
    @Field("blockedReasons")
    private List<String> blockedReasons;

    /** Pattern names detected — flat list used for filtering (Issue #8). */
    @Field("detectedPatterns")
    private List<String> detectedPatterns;

    /** Structured detections with position and action — used for forensic view (Issue #11). */
    @Field("detectedData")
    private List<DetectedDataItem> detectedData;

    /**
     * Total processing time in milliseconds (sanitization + LLM call)
     * Must be < 3000ms for 95% of requests (RNF001)
     */
    @Field("processingTimeMs")
    private int processingTimeMs;

    /**
     * Timestamp of the interaction
     */
    @CreatedDate
    @Indexed
    @Field("timestamp")
    private Instant timestamp;

    /**
     * Client IP address for audit trail
     */
    @Field("ipAddress")
    private String ipAddress;

    /**
     * User agent string from the request
     */
    @Field("userAgent")
    private String userAgent;

    /**
     * Version of the policy used for sanitization
     */
    @Field("policyVersion")
    private String policyVersion;
}
