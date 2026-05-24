package com.datashield.ai.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {

    private String fullName;
    private String department;
    private String role;
    /** null = no change; true = activate; false = suspend. */
    private Boolean active;
}
