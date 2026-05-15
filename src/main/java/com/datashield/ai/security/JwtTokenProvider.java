package com.datashield.ai.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.rsa-private-key:}")
    private String rsaPrivateKeyBase64;

    @Value("${jwt.rsa-public-key:}")
    private String rsaPublicKeyBase64;

    @Value("${jwt.access-token-expiration:900000}")
    private long accessTokenValidityMs;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenValidityMs;

    @Value("${jwt.issuer:datashield-ai}")
    private String issuer;

    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        if (rsaPrivateKeyBase64 != null && !rsaPrivateKeyBase64.isBlank()) {
            KeyFactory kf = KeyFactory.getInstance("RSA");
            privateKey = (RSAPrivateKey) kf.generatePrivate(
                    new PKCS8EncodedKeySpec(Decoders.BASE64.decode(rsaPrivateKeyBase64)));
            publicKey = (RSAPublicKey) kf.generatePublic(
                    new X509EncodedKeySpec(Decoders.BASE64.decode(rsaPublicKeyBase64)));
            log.info("JWT RS256: loaded keys from configuration");
        } else {
            // Ephemeral key pair for dev — tokens won't survive restarts
            KeyPair kp = Keys.keyPairFor(io.jsonwebtoken.SignatureAlgorithm.RS256);
            privateKey = (RSAPrivateKey) kp.getPrivate();
            publicKey  = (RSAPublicKey)  kp.getPublic();
            log.warn("JWT RS256: using ephemeral key pair (dev only). Set jwt.rsa-private-key / jwt.rsa-public-key for production.");
        }
    }

    public String generateAccessToken(UserDetails userDetails) {
        return createToken(new HashMap<>(), userDetails.getUsername(), accessTokenValidityMs);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return createToken(new HashMap<>(), userDetails.getUsername(), refreshTokenValidityMs);
    }

    private String createToken(Map<String, Object> claims, String subject, long expirationMs) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .issuer(issuer)
                .signWith(privateKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    public String getUsernameFromToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token).getPayload();
    }
}
