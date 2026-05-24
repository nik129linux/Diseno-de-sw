package com.datashield.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    /**
     * Email address (unique, lowercase, indexed)
     */
    @Indexed(unique = true)
    @Field("email")
    private String email;

    @Field("fullName")
    private String fullName;

    @Field("department")
    private String department;

    /**
     * BCrypt/Argon2id hashed password (cost ≥12)
     * Null for users authenticated via OIDC/LDAP
     */
    @Field("passwordHash")
    private String passwordHash;

    /**
     * User roles: ROLE_EMPLOYEE, ROLE_ADMIN
     * RBAC enforcement per RNF004
     */
    @Field("roles")
    private List<String> roles;

    /**
     * External ID for LDAP/OIDC integration
     */
    @Field("externalId")
    private String externalId;

    /**
     * Account creation timestamp
     */
    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;

    /**
     * Last login timestamp
     */
    @Field("lastLogin")
    private Instant lastLogin;

    /**
     * Whether the account is active
     */
    @Indexed
    @Field("active")
    private boolean active;
}
