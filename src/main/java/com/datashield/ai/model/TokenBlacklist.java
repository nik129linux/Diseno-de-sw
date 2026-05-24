package com.datashield.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "token_blacklist")
public class TokenBlacklist {

    @Id
    private String tokenHash; // SHA-256 of the raw JWT

    private String userId;

    private Instant revokedAt;

    // MongoDB TTL index: document is auto-deleted when this date is reached,
    // keeping the blacklist lean without manual cleanup jobs.
    @Indexed(expireAfterSeconds = 0)
    private Date expiresAt;
}
