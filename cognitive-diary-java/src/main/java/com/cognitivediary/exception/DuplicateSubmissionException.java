package com.cognitivediary.exception;

public class DuplicateSubmissionException extends CognitiveDiaryException {
    private static final long serialVersionUID = 1L;

    public DuplicateSubmissionException(String message) {
        super("DUPLICATE_SUBMISSION", message);
    }
}
