package com.datashield.ai.repository;

import com.datashield.ai.model.LlmConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LlmConfigRepository extends MongoRepository<LlmConfig, String> {
}
