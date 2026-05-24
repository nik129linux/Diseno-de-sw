package com.datashield.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/** Singleton document (id = "default") — email alert configuration (Issue #16). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_config")
public class NotificationConfig {

    @Id
    private String id; // always "default"

    /** List of configured alert rules. */
    private List<AlertRule> rules;

    private Instant updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertRule {
        /** Recipient email address. */
        private String email;
        /** Alert types that trigger notifications: EMAIL, CREDIT_CARD, CREDENTIAL, etc. */
        private List<String> alertTypes;
        /** immediate | summary_15min | summary_daily */
        private String frequency;
        /** Minimum severity to trigger: LOW | MEDIUM | HIGH */
        private String minSeverity;
        private boolean active;
    }
}
