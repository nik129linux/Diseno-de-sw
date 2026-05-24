package com.datashield.ai.service;

import com.datashield.ai.model.LlmConfig;
import com.datashield.ai.repository.LlmConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LlmConfigService {

    private static final String DEFAULT_ID = "default";

    private final LlmConfigRepository repository;

    @Value("${llm.ollama.base-url:http://localhost:11434/v1}")
    private String defaultBaseUrl;

    @Value("${llm.ollama.model:gemma4:31b-cloud}")
    private String defaultModel;

    /** Returns active config from DB, falling back to application.yml values. */
    public LlmConfig getEffectiveConfig() {
        return repository.findById(DEFAULT_ID).orElseGet(() ->
                LlmConfig.builder()
                        .id(DEFAULT_ID)
                        .baseUrl(defaultBaseUrl)
                        .model(defaultModel)
                        .timeoutSeconds(30)
                        .build());
    }

    /** Returns config for API response — masks the API key. */
    public Map<String, Object> getMasked() {
        LlmConfig cfg = getEffectiveConfig();
        String maskedKey = maskKey(cfg.getApiKey());
        return Map.of(
                "baseUrl", cfg.getBaseUrl() != null ? cfg.getBaseUrl() : "",
                "model", cfg.getModel() != null ? cfg.getModel() : "",
                "apiKey", maskedKey,
                "timeoutSeconds", cfg.getTimeoutSeconds(),
                "updatedAt", cfg.getUpdatedAt() != null ? cfg.getUpdatedAt().toString() : "",
                "updatedBy", cfg.getUpdatedBy() != null ? cfg.getUpdatedBy() : ""
        );
    }

    public LlmConfig update(String baseUrl, String model, String apiKey, int timeoutSeconds, String updatedBy) {
        LlmConfig cfg = repository.findById(DEFAULT_ID).orElse(LlmConfig.builder().id(DEFAULT_ID).build());
        if (baseUrl != null && !baseUrl.isBlank()) cfg.setBaseUrl(baseUrl);
        if (model != null && !model.isBlank()) cfg.setModel(model);
        if (apiKey != null && !apiKey.isBlank()) cfg.setApiKey(apiKey);
        if (timeoutSeconds > 0) cfg.setTimeoutSeconds(timeoutSeconds);
        cfg.setUpdatedAt(Instant.now());
        cfg.setUpdatedBy(updatedBy);
        LlmConfig saved = repository.save(cfg);
        log.info("LLM config updated by={} model={} baseUrl={}", updatedBy, saved.getModel(), saved.getBaseUrl());
        return saved;
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 8) return "****";
        return key.substring(0, 4) + "****" + key.substring(key.length() - 4);
    }
}
