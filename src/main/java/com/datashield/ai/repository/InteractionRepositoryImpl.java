package com.datashield.ai.repository;

import com.datashield.ai.model.Interaction;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class InteractionRepositoryImpl implements InteractionRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Interaction> findByDynamicFilters(
            String userId,
            Boolean blocked,
            String keyword,
            Instant startDate,
            Instant endDate,
            List<String> detectedTypes,
            Pageable pageable) {

        List<Criteria> conditions = new ArrayList<>();

        if (userId != null && !userId.isBlank()) {
            conditions.add(Criteria.where("userId").is(userId));
        }
        if (blocked != null) {
            conditions.add(Criteria.where("blocked").is(blocked));
        }
        if (keyword != null && !keyword.isBlank()) {
            conditions.add(new Criteria().orOperator(
                    Criteria.where("sanitizedPrompt").regex(keyword, "i"),
                    Criteria.where("blockedReasons").regex(keyword, "i")
            ));
        }
        if (startDate != null) {
            conditions.add(Criteria.where("timestamp").gte(startDate));
        }
        if (endDate != null) {
            conditions.add(Criteria.where("timestamp").lte(endDate));
        }
        if (detectedTypes != null && !detectedTypes.isEmpty()) {
            // OR logic: interaction must contain at least one of the requested types
            conditions.add(Criteria.where("detectedPatterns").in(detectedTypes));
        }

        Criteria criteria = conditions.isEmpty()
                ? new Criteria()
                : new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        Query query = new Query(criteria).with(pageable);
        Query countQuery = new Query(criteria);

        long total = mongoTemplate.count(countQuery, Interaction.class);
        List<Interaction> results = mongoTemplate.find(query, Interaction.class);

        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public Double calculateAverageProcessingTime() {
        Aggregation agg = Aggregation.newAggregation(
            Aggregation.group().avg("processingTimeMs").as("avgTime")
        );
        AggregationResults<Document> results =
            mongoTemplate.aggregate(agg, "interactions", Document.class);
        Document unique = results.getUniqueMappedResult();
        if (unique == null) return 0.0;
        Object val = unique.get("avgTime");
        return val instanceof Number n ? n.doubleValue() : 0.0;
    }

    @Override
    public List<Map<String, Object>> findTopDetectedPatterns() {
        Aggregation agg = Aggregation.newAggregation(
            Aggregation.unwind("detectedPatterns"),
            Aggregation.group("detectedPatterns").count().as("count"),
            Aggregation.sort(Sort.Direction.DESC, "count"),
            Aggregation.limit(10)
        );
        AggregationResults<Document> results =
            mongoTemplate.aggregate(agg, "interactions", Document.class);
        return results.getMappedResults().stream()
            .map(d -> Map.<String, Object>of(
                "pattern", d.getString("_id"),
                "count", d.getInteger("count", 0)
            ))
            .toList();
    }
}
