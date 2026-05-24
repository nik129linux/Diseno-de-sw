package com.datashield.ai.controller;

import com.datashield.ai.dto.CreateUserRequest;
import com.datashield.ai.dto.UpdateUserRequest;
import com.datashield.ai.dto.UserDto;
import com.datashield.ai.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    /**
     * GET /api/v1/users?search=juan&role=ROLE_EMPLOYEE&active=true&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<UserDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<UserDto> users = userService.listUsers(
                search, role, active,
                PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending()));

        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/v1/users/list?search=juan
     * Lightweight endpoint for autocomplete dropdowns (audit filter by user, Issue #9).
     */
    @GetMapping("/list")
    public ResponseEntity<Page<UserDto>> getUserList(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<UserDto> users = userService.listUsers(
                search, null, true,
                PageRequest.of(page, Math.min(size, 20), Sort.by("email").ascending()));
        return ResponseEntity.ok(users);
    }

    /**
     * POST /api/v1/users
     * Creates a user with a randomly generated password.
     */
    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            UserDto created = userService.createUser(request);
            return ResponseEntity.status(201).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/v1/users/{id}
     * Updates fields present in the request body; omitted fields are unchanged.
     * Set active=false to suspend, active=true to reactivate.
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable String id,
            @RequestBody UpdateUserRequest request) {
        try {
            return ResponseEntity.ok(userService.updateUser(id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/v1/users/{id}
     * Soft delete: deactivates the account, preserving all audit history.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
