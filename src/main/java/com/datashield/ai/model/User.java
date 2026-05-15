package com.datashield.ai.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

/**
 * User Entity
 * 
 * Supports both local authentication and external identity providers (OIDC/LDAP).
 * Password hash uses BCrypt with cost ≥12 or Argon2id for maximum security.
 */
@Data
@Builder
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
