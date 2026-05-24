package com.datashield.ai.dto;

import com.datashield.ai.model.Interaction;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class HistoryItemDto {

    private String id;
    private Instant timestamp;
    private String promptPreview;    // sanitizedPrompt truncated to 60 chars
    private String responsePreview;  // llmResponse truncated to 60 chars
    private boolean blocked;
    private List<String> detectedPatterns;

    public static HistoryItemDto from(Interaction i) {
        return HistoryItemDto.builder()
                .id(i.getId())
                .timestamp(i.getTimestamp())
                .promptPreview(truncate(i.getSanitizedPrompt(), 60))
                .responsePreview(truncate(i.getLlmResponse(), 60))
                .blocked(i.isBlocked())
                .detectedPatterns(i.getDetectedPatterns())
                .build();
    }

    private static String truncate(String text, int maxLen) {
        if (text == null) return null;
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "…";
    }
}
