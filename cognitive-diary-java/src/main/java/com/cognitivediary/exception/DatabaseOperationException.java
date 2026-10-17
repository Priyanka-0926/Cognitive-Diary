package com.cognitivediary.exception;

public class DatabaseOperationException extends CognitiveDiaryException {
    private static final long serialVersionUID = 1L;

    public DatabaseOperationException(String message, Throwable cause) {
        super("DATABASE_ERROR", message, cause);
    }
}
