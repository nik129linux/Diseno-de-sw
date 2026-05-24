package com.datashield.ai.controller;

import com.datashield.ai.dto.HistoryItemDto;
import com.datashield.ai.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final InteractionRepository interactionRepository;

    /**
     * GET /api/v1/chat/history
     *
     * Returns the authenticated employee's interaction history in reverse-chronological order.
     * Each item shows only the sanitized prompt preview — the original prompt is never exposed.
     * Employees see only their own records; access is logged per Issue #5.
     *
     * @param page zero-based page number (default 0)
     * @param size items per page (default 20, max 50)
     */
    @GetMapping("/history")
    public ResponseEntity<Page<HistoryItemDto>> getHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userId = authentication.getName();

        // Clamp page size to prevent oversized responses
        int clampedSize = Math.min(size, 50);

        Page<HistoryItemDto> history = interactionRepository
                .findByUserIdOrderByTimestampDesc(userId, PageRequest.of(page, clampedSize))
                .map(HistoryItemDto::from);

        log.info("event=history_viewed userId={} page={} size={} totalElements={}",
                userId, page, clampedSize, history.getTotalElements());

        return ResponseEntity.ok(history);
    }
}
