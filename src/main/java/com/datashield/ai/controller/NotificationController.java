package com.datashield.ai.controller;

import com.datashield.ai.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Notification Controller (Admin Only)
 * 
 * Manages email notifications for security alerts.
 * Implements RNF009: Alert admins when sensitive data is detected.
 * Uses Spring Mail with STARTTLS and Thymeleaf templates.
 * 
 * Endpoints:
 * - POST /api/v1/notifications/test - Send test email
 * - GET /api/v1/notifications/status - Get notification settings
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@ConditionalOnBean(EmailService.class)
public class NotificationController {

    private final EmailService emailService;

    /**
     * Send test email to verify SMTP configuration
     * 
     * POST /api/v1/notifications/test
     * Body: {recipientEmail} (optional, defaults to admin email)
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestNotification(
            @RequestBody(required = false) Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        String recipientEmail = (request != null && request.containsKey("recipientEmail")) 
            ? request.get("recipientEmail") 
            : "admin@datashield.ai";
        
        log.info("Test notification requested for: {}", recipientEmail);
        
        boolean success = emailService.sendTestEmail(recipientEmail);
        
        response.put("success", success);
        if (success) {
            response.put("message", "Test email sent successfully to " + recipientEmail);
        } else {
            response.put("message", "Failed to send email. Check SMTP configuration in application.yml");
        }
        response.put("smtpEnabled", System.getenv("EMAIL_ENABLED") != null ? 
                                     System.getenv("EMAIL_ENABLED") : "true");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get notification settings status
     * 
     * GET /api/v1/notifications/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getNotificationStatus() {
        Map<String, Object> status = new HashMap<>();
        
        status.put("emailEnabled", true);
        status.put("smtpConfigured", System.getenv("SMTP_HOST") != null);
        status.put("alertOnBlock", true);
        status.put("templatesLoaded", true);
        
        return ResponseEntity.ok(status);
    }
}
