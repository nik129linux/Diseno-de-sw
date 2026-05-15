package com.datashield.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromptRequest {

    @NotBlank(message = "Prompt is required")
    private String prompt;

    /** Previous turns: [{role:"user",content:"..."},{role:"assistant",content:"..."}] */
    private List<Map<String, String>> history;
}
