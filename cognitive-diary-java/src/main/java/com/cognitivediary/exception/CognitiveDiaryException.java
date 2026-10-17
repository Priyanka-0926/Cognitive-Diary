package com.cognitivediary.exception;

/**
 * Base custom exception for Cognitive Diary domain, demonstrating structured Exception Handling.
 */
public class CognitiveDiaryException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final String errorCode;

    public CognitiveDiaryException(String message) {
        super(message);
        this.errorCode = "GENERAL_ERROR";
    }

    public CognitiveDiaryException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public CognitiveDiaryException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
