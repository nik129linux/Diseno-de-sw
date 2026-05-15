package com.datashield.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Email Service for sending security alerts and notifications.
 * 
 * Implements RNF009: Alert admins when sensitive data is detected.
 * Uses Spring Mail with STARTTLS and Thymeleaf for HTML templates.
 * 
 * Features:
 * - HTML email templates with Thymeleaf
 * - Async email sending (non-blocking)
 * - Support for attachments (optional)
 * - Configurable SMTP with STARTTLS
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    /**
     * Sends a test email to verify SMTP configuration.
     * 
     * @param recipientEmail the email address to send to
     * @return true if email was sent successfully
     */
    public boolean sendTestEmail(String recipientEmail) {
        log.info("Sending test email to {}", recipientEmail);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("noreply@datashield.ai");
            helper.setTo(recipientEmail);
            helper.setSubject("[DataShield AI] Test Email - SMTP Configuration Verified");
            
            Context context = new Context();
            context.setVariable("title", "SMTP Configuration Successful");
            context.setVariable("message", "Your email service is properly configured and working.");
            context.setVariable("timestamp", Instant.now());
            context.setVariable("type", "success");
            
            String htmlContent = templateEngine.process("email/test-email", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Test email sent successfully to {}", recipientEmail);
            return true;
            
        } catch (MessagingException e) {
            log.error("Failed to send test email to {}: {}", recipientEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Sends an alert email when sensitive data is detected and blocked.
     * 
     * @param recipientEmail the admin email to notify
     * @param userName the user who triggered the alert
     * @param blockedReasons list of reasons why the prompt was blocked
     * @param ipAddress the IP address of the request
     * @param timestamp when the event occurred
     * @return true if email was sent successfully
     */
    public boolean sendSecurityAlert(String recipientEmail, String userName, 
                                     java.util.List<String> blockedReasons,
                                     String ipAddress, Instant timestamp) {
        log.info("Sending security alert to {} for user {}", recipientEmail, userName);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("noreply@datashield.ai");
            helper.setTo(recipientEmail);
            helper.setSubject("[DataShield AI] Security Alert - Sensitive Data Detected");
            
            Context context = new Context();
            context.setVariable("title", "Security Alert: Sensitive Data Blocked");
            context.setVariable("userName", userName);
            context.setVariable("blockedReasons", blockedReasons);
            context.setVariable("ipAddress", ipAddress);
            context.setVariable("timestamp", timestamp);
            context.setVariable("type", "alert");
            context.setVariable("actionRequired", true);
            
            String htmlContent = templateEngine.process("email/security-alert", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Security alert sent successfully to {}", recipientEmail);
            return true;
            
        } catch (MessagingException e) {
            log.error("Failed to send security alert to {}: {}", recipientEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Sends a daily summary email with statistics.
     * 
     * @param recipientEmail the admin email
     * @param totalInteractions total number of interactions in the period
     * @param blockedCount number of blocked prompts
     * @param topPatterns most activated patterns
     * @return true if email was sent successfully
     */
    public boolean sendDailySummary(String recipientEmail, long totalInteractions, 
                                    long blockedCount, Map<String, Integer> topPatterns) {
        log.info("Sending daily summary to {}", recipientEmail);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("noreply@datashield.ai");
            helper.setTo(recipientEmail);
            helper.setSubject("[DataShield AI] Daily Security Summary");
            
            Context context = new Context();
            context.setVariable("title", "Daily Security Summary");
            context.setVariable("totalInteractions", totalInteractions);
            context.setVariable("blockedCount", blockedCount);
            context.setVariable("blockRate", totalInteractions > 0 ? 
                String.format("%.2f", (blockedCount * 100.0) / totalInteractions) : "0");
            context.setVariable("topPatterns", topPatterns);
            context.setVariable("timestamp", Instant.now());
            context.setVariable("type", "summary");
            
            String htmlContent = templateEngine.process("email/daily-summary", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Daily summary sent successfully to {}", recipientEmail);
            return true;
            
        } catch (MessagingException e) {
            log.error("Failed to send daily summary to {}: {}", recipientEmail, e.getMessage());
            return false;
        }
    }
}
