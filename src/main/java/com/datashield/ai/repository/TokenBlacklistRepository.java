package com.datashield.ai.repository;

import com.datashield.ai.model.TokenBlacklist;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TokenBlacklistRepository extends MongoRepository<TokenBlacklist, String> {

    boolean existsByTokenHash(String tokenHash);
}
