package com.datashield.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Structured record of a single sensitive data detection.
 * Stored in Interaction.detectedData for forensic audit view (Issue #11).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetectedDataItem {

    /** Pattern name, e.g. "EMAIL", "CREDIT_CARD". Acts as ruleId. */
    private String type;

    /** Character offset where the match starts in the original prompt. */
    private int startPos;

    /** Character offset where the match ends (exclusive). */
    private int endPos;

    /** Action that was applied: BLOCK | MASK | WARN. */
    private String action;
}
