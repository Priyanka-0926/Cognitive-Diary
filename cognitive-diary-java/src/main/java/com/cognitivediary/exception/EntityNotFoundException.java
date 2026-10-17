package com.cognitivediary.exception;

public class EntityNotFoundException extends CognitiveDiaryException {
    private static final long serialVersionUID = 1L;

    public EntityNotFoundException(String entityType, String id) {
        super("NOT_FOUND", String.format("%s with ID '%s' was not found.", entityType, id));
    }
}
