package com.datashield.ai.integration;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LlmService {

    private final MockLlmService mockLlmService;
    private final RestTemplate restTemplate;

    @Value("${llm.provider:ollama}")
    private String llmProvider;

    @Value("${llm.ollama.base-url:http://host.docker.internal:11434/v1}")
    private String ollamaBaseUrl;

    @Value("${llm.ollama.model:gemma4:31b-cloud}")
    private String ollamaModel;

    @CircuitBreaker(name = "llmService", fallbackMethod = "fallbackResponse")
    @Retry(name = "llmService")
    public String generateCompletion(String sanitizedPrompt) {
        if ("mock".equalsIgnoreCase(llmProvider)) {
            return mockLlmService.generateResponse(sanitizedPrompt);
        }

        if ("ollama".equalsIgnoreCase(llmProvider)) {
            return callOpenAiCompatible(ollamaBaseUrl, ollamaModel, null, sanitizedPrompt);
        }

        log.warn("Unknown LLM provider '{}', falling back to mock", llmProvider);
        return mockLlmService.generateResponse(sanitizedPrompt);
    }

    private String callOpenAiCompatible(String baseUrl, String model, String apiKey, String prompt) {
        log.info("Calling LLM provider={} model={}", llmProvider, model);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "max_tokens", 1024,
            "temperature", 0.7
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                baseUrl + "/chat/completions", entity, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<?> choices = (List<?>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> message = (Map<?, ?>) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            throw new RuntimeException("Empty or unexpected response from " + llmProvider);
        } catch (Exception e) {
            log.error("LLM call failed (provider={}): {}", llmProvider, e.getMessage());
            throw e;
        }
    }

    public String fallbackResponse(String sanitizedPrompt, Throwable t) {
        log.error("LLM service unavailable, using fallback: {}", t.getMessage());
        return "The AI service is temporarily unavailable. Please try again in a few moments.";
    }

    public boolean isHealthy() {
        return !"mock".equalsIgnoreCase(llmProvider) || mockLlmService != null;
    }
}
