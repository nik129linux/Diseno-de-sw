package com.datashield.ai.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Mock LLM Service
 * 
 * Provides mock LLM responses for testing and development.
 * Prevents spending tokens in non-production environments.
 * 
 * In production, this should be replaced with actual OpenAI/LLM integration.
 */
@Slf4j
@Service
public class MockLlmService {

    @Value("${llm.provider:mock}")
    private String llmProvider;

    /**
     * Generate mock response for sanitized prompt
     * 
     * @param sanitizedPrompt prompt that has passed DLP sanitization
     * @return mock LLM response
     */
    public String generateResponse(String sanitizedPrompt) {
        log.debug("Mock LLM processing prompt (length={})", sanitizedPrompt.length());
        
        // Simulate processing delay (50-200ms)
        try {
            Thread.sleep(50 + (long) (Math.random() * 150));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Generate contextual mock response
        String truncated = sanitizedPrompt.length() > 100 
            ? sanitizedPrompt.substring(0, 100) + "..." 
            : sanitizedPrompt;
        
        return String.format(
            "[MOCK LLM RESPONSE] I received your sanitized prompt: \"%s\". " +
            "This is a mock response for testing purposes. In production, " +
            "this would connect to OpenAI or another LLM provider.", 
            truncated
        );
    }

    /**
     * Check if mock mode is enabled
     */
    public boolean isMockMode() {
        return "mock".equalsIgnoreCase(llmProvider);
    }
}
