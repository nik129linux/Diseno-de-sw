package com.datashield.ai.repository;

import com.datashield.ai.model.NotificationConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationConfigRepository extends MongoRepository<NotificationConfig, String> {
}
