package com.datashield.ai.controller;

import com.datashield.ai.model.Interaction;
import com.datashield.ai.repository.InteractionRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Export Controller — Issue #12
 *
 * GET /api/v1/audit/export?format=csv&...filters...
 *
 * - Sensitive data shown as [REDACTED] by default.
 * - Max 10,000 records per export.
 * - Streams directly to the response (no temp file).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/audit/export")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExportController {

    private static final int MAX_RECORDS = 10_000;
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter TS_FMT =
            DateTimeFormatter.ISO_INSTANT;

    private final InteractionRepository interactionRepository;

    @GetMapping
    public void export(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Boolean blocked,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) List<String> types,
            @AuthenticationPrincipal UserDetails admin,
            HttpServletResponse response) throws IOException {

        if (!"csv".equalsIgnoreCase(format)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Only format=csv is supported");
            return;
        }

        String filename = "datashield_audit_" + FMT.format(Instant.now()) + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        var pageable = PageRequest.of(0, MAX_RECORDS, Sort.by("timestamp").descending());
        var page = interactionRepository.findByDynamicFilters(
                userId, blocked, keyword, startDate, endDate, types, pageable);

        log.info("CSV export by={} records={} filters=userId:{},blocked:{},types:{}",
                admin.getUsername(), page.getTotalElements(), userId, blocked, types);

        // Use OutputStream exclusively to avoid getWriter/getOutputStream conflict.
        // Write UTF-8 BOM first (Excel compatibility), then the CSV body.
        var out = response.getOutputStream();
        out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        var writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);

        try (CSVPrinter printer = new CSVPrinter(writer,
                CSVFormat.DEFAULT.builder()
                        .setHeader("id", "timestamp", "userId", "conversationId",
                                   "sanitizedPrompt", "llmResponse",
                                   "blocked", "detectedPatterns", "processingTimeMs", "ipAddress")
                        .build())) {

            for (Interaction i : page.getContent()) {
                printer.printRecord(
                        i.getId(),
                        i.getTimestamp() != null ? TS_FMT.format(i.getTimestamp()) : "",
                        i.getUserId(),
                        i.getConversationId() != null ? i.getConversationId() : "",
                        "[REDACTED]",   // sanitizedPrompt redacted by default
                        "[REDACTED]",   // llmResponse redacted by default
                        i.isBlocked(),
                        i.getDetectedPatterns() != null ? String.join("|", i.getDetectedPatterns()) : "",
                        i.getProcessingTimeMs(),
                        i.getIpAddress() != null ? i.getIpAddress() : ""
                );
            }
        }
    }
}
