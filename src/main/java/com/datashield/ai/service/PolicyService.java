package com.datashield.ai.service;

import com.datashield.ai.model.Policy;
import com.datashield.ai.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Policy Service
 * 
 * Manages DLP policies with hot-reload support.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;

    /**
     * Get all enabled policies
     */
    @Cacheable(value = "enabledPolicies", unless = "#result.isEmpty()")
    public List<Policy> getEnabledPolicies() {
        return policyRepository.findByEnabledTrue();
    }

    /**
     * Get policy by ID
     */
    @Cacheable(value = "policy", key = "#id")
    public Policy getPolicyById(String id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
    }

    /**
     * Create new policy
     */
    @Transactional
    @CacheEvict(value = "enabledPolicies", allEntries = true)
    public Policy createPolicy(Policy policy, String createdBy) {
        policy.setCreatedAt(Instant.now());
        policy.setUpdatedAt(Instant.now());
        policy.setCreatedBy(createdBy);
        return policyRepository.save(policy);
    }

    /**
     * Update existing policy
     */
    @Transactional
    @CacheEvict(value = {"enabledPolicies", "policy"}, allEntries = true)
    public Policy updatePolicy(String id, Policy updatedPolicy) {
        Policy existingPolicy = getPolicyById(id);
        
        existingPolicy.setName(updatedPolicy.getName());
        existingPolicy.setDescription(updatedPolicy.getDescription());
        existingPolicy.setRegexPatterns(updatedPolicy.getRegexPatterns());
        existingPolicy.setEnabled(updatedPolicy.isEnabled());
        existingPolicy.setUpdatedAt(Instant.now());
        
        return policyRepository.save(existingPolicy);
    }

    /**
     * Delete policy
     */
    @Transactional
    @CacheEvict(value = {"enabledPolicies", "policy"}, allEntries = true)
    public void deletePolicy(String id) {
        if (!policyRepository.existsById(id)) {
            throw new IllegalArgumentException("Policy not found: " + id);
        }
        policyRepository.deleteById(id);
    }

    /**
     * Enable/disable policy
     */
    @Transactional
    @CacheEvict(value = {"enabledPolicies", "policy"}, allEntries = true)
    public Policy togglePolicy(String id, boolean enabled) {
        Policy policy = getPolicyById(id);
        policy.setEnabled(enabled);
        policy.setUpdatedAt(Instant.now());
        return policyRepository.save(policy);
    }
}
