package com.datashield.ai.integration;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * LLM Service - Integration with AI Providers
 * 
 * Handles communication with external LLM providers (OpenAI, etc.)
 * with circuit breaker and retry patterns for resilience.
 * 
 * Features:
 * - Circuit breaker (Resilience4j) for fault tolerance
 * - Automatic retries with exponential backoff
 * - Fallback responses when service is unavailable
 * - Configurable provider via application.yml
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmService {

    private final MockLlmService mockLlmService;

    @Value("${llm.provider:mock}")
    private String llmProvider;

    @Value("${llm.timeout:30000}")
    private long timeoutMs;

    /**
     * Send prompt to LLM and get response
     * 
     * @param sanitizedPrompt prompt that has passed DLP sanitization
     * @return LLM response text
     */
    @CircuitBreaker(name = "llmService", fallbackMethod = "fallbackResponse")
    @Retry(name = "llmService")
    public String generateCompletion(String sanitizedPrompt) {
        log.info("Sending request to LLM provider: {}", llmProvider);
        
        // Use mock service in dev/test or if configured
        if ("mock".equalsIgnoreCase(llmProvider) || mockLlmService.isMockMode()) {
            return mockLlmService.generateResponse(sanitizedPrompt);
        }
        
        // TODO: Implement actual OpenAI integration with Feign client
        // For now, delegate to mock even if provider is set to openai
        log.warn("OpenAI provider not yet implemented, using mock response");
        return mockLlmService.generateResponse(sanitizedPrompt);
    }

    /**
     * Fallback method for circuit breaker
     * Returns safe response when LLM service is unavailable
     */
    public String fallbackResponse(String sanitizedPrompt, Throwable t) {
        log.error("LLM service unavailable, using fallback: {}", t.getMessage());
        return "The AI service is temporarily unavailable. Please try again in a few moments. " +
               "Error reference: " + t.getClass().getSimpleName();
    }

    /**
     * Health check for LLM connectivity
     * 
     * @return true if LLM service is reachable
     */
    public boolean isHealthy() {
        try {
            if ("mock".equalsIgnoreCase(llmProvider)) {
                return true;
            }
            // TODO: Implement actual health check for OpenAI
            return true;
        } catch (Exception e) {
            log.error("LLM health check failed", e);
            return false;
        }
    }
}
