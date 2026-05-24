package com.datashield.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Singleton document — always stored with id = "default".
 * Takes precedence over application.yml values at runtime.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "llm_config")
public class LlmConfig {

    @Id
    private String id; // always "default"

    private String baseUrl;
    private String model;
    /** Stored encrypted/masked; never returned in plain text via API. */
    private String apiKey;
    /** Request timeout in seconds (10–120). */
    private int timeoutSeconds;

    private Instant updatedAt;
    private String updatedBy;
}
