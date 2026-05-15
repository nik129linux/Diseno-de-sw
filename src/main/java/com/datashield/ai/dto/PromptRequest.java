package com.datashield.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

/**
 * Prompt Submission Request DTO
 */
@Data
@Builder
public class PromptRequest {

    @NotBlank(message = "Prompt is required")
    private String prompt;
}
