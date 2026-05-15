package com.datashield.ai.repository;

import com.datashield.ai.model.Interaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Interaction Repository - Audit Log Storage
 * 
 * Immutable append-only storage for security compliance.
 */
@Repository
public interface InteractionRepository extends MongoRepository<Interaction, String> {

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

    /**
     * Custom query for filtering interactions with multiple criteria
     * Uses MongoDB aggregation for optimal performance with large datasets
     */
    @Query("{ " +
        "?0 != null : {'userId': ?0}, " +
        "?1 != null : {'blocked': ?1}, " +
        "?2 != null : {'$or': [{'sanitizedPrompt': {$regex: ?2, $options: 'i'}}, {'blockedReasons': {$regex: ?2, $options: 'i'}}]}, " +
        "?3 != null : {'timestamp': {$gte: ?3}}, " +
        "?4 != null : {'timestamp': {$lte: ?4}} " +
    "}")
    Page<Interaction> findByFilters(String userId, Boolean blocked, String keyword, 
                                    Instant startDate, Instant endDate, Pageable pageable);

    /**
     * Calculate average processing time using aggregation
     */
    @Aggregation(pipeline = {
        "{ $group: { _id: null, avgTime: { $avg: '$processingTimeMs' } } }",
        "{ $project: { _id: 0, avgTime: 1 } }"
    })
    Double calculateAverageProcessingTime();

    /**
     * Get top blocked patterns using aggregation
     */
    @Aggregation(pipeline = {
        "{ $match: { blocked: true } }",
        "{ $unwind: '$blockedReasons' }",
        "{ $group: { _id: '$blockedReasons', count: { $sum: 1 } } }",
        "{ $sort: { count: -1 } }",
        "{ $limit: 10 }"
    })
    List<PatternCount> findTopBlockedPatterns();

    /**
     * Interface for pattern count projection
     */
    interface PatternCount {
        String getId();
        long getCount();
    }
}
