package com.datashield.ai.dto;

import com.datashield.ai.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class UserDto {

    private String id;
    private String email;
    private String fullName;
    private String department;
    private List<String> roles;
    private String status; // "ACTIVE" | "SUSPENDED"
    private Instant createdAt;
    private Instant lastLogin;

    public static UserDto from(User u) {
        return UserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .department(u.getDepartment())
                .roles(u.getRoles())
                .status(u.isActive() ? "ACTIVE" : "SUSPENDED")
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .build();
    }
}
