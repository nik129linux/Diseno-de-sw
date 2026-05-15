package com.datashield.ai.repository;

import com.datashield.ai.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * User Repository
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find user by email (case-insensitive)
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Check if user exists by email
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Find active users by role
     */
    List<User> findByRolesContainingAndActiveTrue(String role);

    /**
     * Find user by external ID (for OIDC/LDAP)
     */
    Optional<User> findByExternalId(String externalId);
}
