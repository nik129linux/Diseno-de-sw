package com.datashield.ai.config;

import com.datashield.ai.model.Policy;
import com.datashield.ai.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Seeds the database with a default DLP policy on first startup.
 * Runs only when no active policy exists, so it is safe to restart repeatedly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final PolicyRepository policyRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (!policyRepository.findByEnabledTrue().isEmpty()) {
            log.info("Active policy already exists — skipping default seed");
            return;
        }

        Policy defaultPolicy = Policy.builder()
                .name("Default DLP Policy")
                .description("Built-in patterns covering all sensitive data categories required by Issue #6")
                .enabled(true)
                .createdBy("system")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .regexPatterns(List.of(
                        pattern("EMAIL",
                                "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
                                "MASK", 1),
                        pattern("CREDIT_CARD",
                                "\\b(?:\\d[ \\-]?){13,19}\\b",
                                "BLOCK", 2),
                        pattern("DNI",
                                "\\b[0-9]{8}[A-HJ-NP-TV-Z]\\b",
                                "MASK", 3),
                        pattern("PHONE",
                                "\\b(?:\\+?34)?[ \\-]?[6-9]\\d{2}[ \\-]?\\d{3}[ \\-]?\\d{3}\\b",
                                "MASK", 4),
                        pattern("IP_ADDRESS",
                                "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
                                "MASK", 5),
                        pattern("CREDENTIAL",
                                "(?i)(?:api[_\\-]?key|token|secret|password|passwd|pwd)\\s*[=:]\\s*\\S+",
                                "BLOCK", 6)
                ))
                .build();

        policyRepository.save(defaultPolicy);
        log.info("Default DLP policy seeded with 6 patterns (EMAIL, CREDIT_CARD, DNI, PHONE, IP_ADDRESS, CREDENTIAL)");
    }

    private Policy.RegexPattern pattern(String name, String regex, String action, int priority) {
        return Policy.RegexPattern.builder()
                .name(name)
                .pattern(regex)
                .action(action)
                .priority(priority)
                .enabled(true)
                .falsePositiveRate(0.0)
                .build();
    }
}
