package com.datashield.ai.service;

import com.datashield.ai.dto.CreateUserRequest;
import com.datashield.ai.dto.UpdateUserRequest;
import com.datashield.ai.dto.UserDto;
import com.datashield.ai.model.User;
import com.datashield.ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final PasswordEncoder passwordEncoder;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    public Page<UserDto> listUsers(String search, String role, Boolean active, Pageable pageable) {
        List<Criteria> conditions = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            conditions.add(new Criteria().orOperator(
                    Criteria.where("email").regex(search, "i"),
                    Criteria.where("fullName").regex(search, "i")
            ));
        }
        if (role != null && !role.isBlank()) {
            conditions.add(Criteria.where("roles").in(role));
        }
        if (active != null) {
            conditions.add(Criteria.where("active").is(active));
        }

        Criteria criteria = conditions.isEmpty()
                ? new Criteria()
                : new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        Query query = new Query(criteria).with(pageable);
        long total = mongoTemplate.count(new Query(criteria), User.class);
        List<User> users = mongoTemplate.find(query, User.class);

        return new PageImpl<>(users.stream().map(UserDto::from).toList(), pageable, total);
    }

    public UserDto createUser(CreateUserRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + req.getEmail());
        }

        String rawPassword = generatePassword(12);
        String role = (req.getRole() != null && !req.getRole().isBlank()) ? req.getRole() : "ROLE_EMPLOYEE";

        User user = User.builder()
                .email(req.getEmail().toLowerCase())
                .fullName(req.getFullName())
                .department(req.getDepartment())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .roles(List.of(role))
                .active(true)
                .build();

        User saved = userRepository.save(user);
        log.info("User created: email={} role={}", saved.getEmail(), role);
        return UserDto.from(saved);
    }

    public UserDto updateUser(String id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
        if (req.getRole() != null) user.setRoles(List.of(req.getRole()));
        if (req.getActive() != null) user.setActive(req.getActive());

        User saved = userRepository.save(user);
        log.info("User updated: id={} active={}", id, saved.isActive());
        return UserDto.from(saved);
    }

    /** Soft delete: deactivates the account without removing audit history. */
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated (soft delete): id={}", id);
    }

    private String generatePassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
