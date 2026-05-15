package com.datashield.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * DataShield AI - DLP Middleware for LLM APIs
 * 
 * Main application entry point.
 * 
 * Features:
 * - Real-time data sanitization before LLM processing
 * - JWT-based authentication with RBAC
 * - MongoDB audit logging (immutable)
 * - Resilience4j circuit breaker for LLM calls
 * - Caffeine cache for compiled regex patterns (<200ms target)
 */
@SpringBootApplication
@EnableCaching
@EnableMongoAuditing
@EnableAsync
public class DataShieldAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataShieldAiApplication.class, args);
    }
}
