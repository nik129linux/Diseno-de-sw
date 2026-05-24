package com.datashield.ai.service;

import com.datashield.ai.model.TokenBlacklist;
import com.datashield.ai.repository.TokenBlacklistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final TokenBlacklistRepository repository;

    public void revoke(String rawToken, Date expiresAt, String userId) {
        String hash = sha256(rawToken);
        TokenBlacklist entry = TokenBlacklist.builder()
                .tokenHash(hash)
                .userId(userId)
                .revokedAt(Instant.now())
                .expiresAt(expiresAt)
                .build();
        repository.save(entry);
        log.info("Token revoked for user={}", userId);
    }

    public boolean isRevoked(String rawToken) {
        return repository.existsByTokenHash(sha256(rawToken));
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
