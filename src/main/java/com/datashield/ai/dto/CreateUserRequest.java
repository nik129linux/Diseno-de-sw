package com.datashield.ai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank @Email
    private String email;

    @NotBlank
    private String fullName;

    private String department;

    /** Defaults to ROLE_EMPLOYEE if not supplied. */
    private String role;
}
