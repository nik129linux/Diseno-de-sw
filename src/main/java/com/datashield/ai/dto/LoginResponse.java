package com.datashield.ai.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Authentication Response DTO
 */
@Data
@Builder
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
}
