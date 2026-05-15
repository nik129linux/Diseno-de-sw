package com.datashield.ai.repository;

import com.datashield.ai.model.Policy;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Policy Repository
 */
@Repository
public interface PolicyRepository extends MongoRepository<Policy, String> {

    /**
     * Find all enabled policies
     */
    List<Policy> findByEnabledTrue();

    /**
     * Find policy by name
     */
    Policy findByName(String name);
}
