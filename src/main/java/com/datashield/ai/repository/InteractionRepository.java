package com.datashield.ai.repository;

import com.datashield.ai.model.Interaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Interaction Repository - Audit Log Storage
 * 
 * Immutable append-only storage for security compliance.
 */
@Repository
public interface InteractionRepository extends MongoRepository<Interaction, String>, InteractionRepositoryCustom {

    /**
     * Find interactions by user ID with pagination
     */
    Page<Interaction> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    /**
     * Find blocked interactions with pagination
     */
    Page<Interaction> findByBlockedTrueOrderByTimestampDesc(Pageable pageable);

    /**
     * Find interactions within a time range
     */
    Page<Interaction> findByTimestampBetweenOrderByTimestampDesc(Instant start, Instant end, Pageable pageable);

    /**
     * Find interactions by user and time range
     */
    Page<Interaction> findByUserIdAndTimestampBetweenOrderByTimestampDesc(
            String userId, Instant start, Instant end, Pageable pageable);

    /**
     * Count total interactions
     */
    long count();

    /**
     * Count blocked interactions
     */
    long countByBlockedTrue();

    /**
     * Count interactions by timestamp range
     */
    long countByTimestampBetween(Instant start, Instant end);

    /**
     * Count blocked interactions by timestamp range
     */
    long countByBlockedAndTimestampBetween(boolean blocked, Instant start, Instant end);

    /**
     * Find interaction by original prompt hash (for deduplication)
     */
    Interaction findByOriginalPromptHash(String hash);


}
