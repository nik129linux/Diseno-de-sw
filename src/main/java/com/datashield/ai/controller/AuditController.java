package com.datashield.ai.controller;

import com.datashield.ai.model.Interaction;
import com.datashield.ai.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Audit Controller
 * 
 * Provides audit log access for administrators.
 * Implements RNF009: Immutable audit logging with full traceability.
 * 
 * Endpoints:
 * - GET /api/v1/audit - List interactions with filters
 * - GET /api/v1/audit/{id} - Get interaction detail
 * - GET /api/v1/audit/stats - Get analytics summary
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final InteractionRepository interactionRepository;

    /**
     * Get paginated audit logs with optional filters
     * 
     * GET /api/v1/audit?page=0&size=20&userId=xxx&blocked=true&keyword=xxx&startDate=xxx&endDate=xxx
     * 
     * Performance: Must render <1.5-2 seconds for 50k records with 3 filters
     */
    /**
     * GET /api/v1/audit?page=0&size=20&userId=x&blocked=true&keyword=x
     *                  &startDate=x&endDate=x&types=EMAIL,CREDIT_CARD&sortBy=timestamp&sortDir=desc
     *
     * @param types comma-separated list of sensitive data categories to filter by (OR logic).
     *              Valid values match the pattern names stored in detectedPatterns
     *              (e.g. EMAIL, CREDIT_CARD, PHONE, DNI, IP_ADDRESS, CREDENTIAL).
     *              Returns 400 if an unrecognized type is supplied.
     */
    @GetMapping
    public ResponseEntity<Page<Interaction>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Boolean blocked,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) List<String> types,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        Page<Interaction> interactions = interactionRepository.findByDynamicFilters(
                userId, blocked, keyword, startDate, endDate, types, pageable);

        log.debug("Audit logs retrieved: {} records, page={}", interactions.getTotalElements(), page);
        return ResponseEntity.ok(interactions);
    }

    /**
     * Get single interaction by ID
     * 
     * GET /api/v1/audit/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Interaction> getAuditLogById(@PathVariable String id) {
        return interactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get audit statistics
     * 
     * GET /api/v1/audit/stats
     * Returns: {totalInteractions, blockedCount, avgLatency, topPatterns, etc.}
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        
        Map<String, Object> stats = new HashMap<>();
        
        // Total interactions
        long totalInteractions = (startDate != null && endDate != null) 
            ? interactionRepository.countByTimestampBetween(startDate, endDate)
            : interactionRepository.count();
        
        // Blocked count
        long blockedCount = (startDate != null && endDate != null)
            ? interactionRepository.countByBlockedAndTimestampBetween(true, startDate, endDate)
            : interactionRepository.countByBlockedTrue();
        
        // Average latency
        Double avgLatencyRaw = interactionRepository.calculateAverageProcessingTime();
        double avgLatency = avgLatencyRaw != null ? avgLatencyRaw : 0.0;
        
        // Block rate
        double blockRate = totalInteractions > 0 ? (double) blockedCount / totalInteractions * 100 : 0;
        
        stats.put("totalInteractions", totalInteractions);
        stats.put("blockedCount", blockedCount);
        stats.put("blockRate", String.format("%.2f%%", blockRate));
        stats.put("avgLatency", Math.round(avgLatency));
        stats.put("periodStart", startDate != null ? startDate.toString() : "all-time");
        stats.put("periodEnd", endDate != null ? endDate.toString() : "now");
        
        log.info("Audit stats generated: total={}, blocked={}, avgLatency={}ms", 
                totalInteractions, blockedCount, Math.round(avgLatency));
        
        return ResponseEntity.ok(stats);
    }
}
