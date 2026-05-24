package com.datashield.ai.repository;

import com.datashield.ai.model.Interaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface InteractionRepositoryCustom {

    Page<Interaction> findByDynamicFilters(
            String userId,
            Boolean blocked,
            String keyword,
            Instant startDate,
            Instant endDate,
            List<String> detectedTypes,
            Pageable pageable);
}
