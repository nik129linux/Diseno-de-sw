package com.datashield.ai.exception;

/**
 * Sanitization Exception
 * 
 * Thrown when sanitization fails or exceeds time limits.
 */
public class SanitizationException extends RuntimeException {

    public SanitizationException(String message) {
        super(message);
    }

    public SanitizationException(String message, Throwable cause) {
        super(message, cause);
    }
}
