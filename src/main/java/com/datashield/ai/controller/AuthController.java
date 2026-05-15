package com.datashield.ai.controller;

import com.datashield.ai.dto.LoginRequest;
import com.datashield.ai.dto.LoginResponse;
import com.datashield.ai.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

/**
 * Authentication Controller
 * 
 * Handles user login and token refresh.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    // Note: CustomUserDetailsService is used internally by AuthenticationManager

    /**
     * Login endpoint - authenticates user and returns JWT tokens
     * 
     * POST /api/v1/auth/login
     * Body: {email, password}
     * Response: {accessToken, refreshToken}
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // Authenticate user
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        // Load user details (needed for token generation)
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
            request.getEmail(),
            "", // Password not needed after authentication
            java.util.Collections.emptyList()
        );

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L) // 15 minutes
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Refresh token endpoint
     * 
     * POST /api/v1/auth/refresh
     * Body: {refreshToken}
     * Response: {accessToken}
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.badRequest().build();
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
            username,
            "",
            java.util.Collections.emptyList()
        );

        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        LoginResponse response = LoginResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(900000L)
                .build();

        return ResponseEntity.ok(response);
    }
}
