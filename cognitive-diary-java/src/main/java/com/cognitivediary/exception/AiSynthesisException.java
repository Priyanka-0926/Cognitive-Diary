package com.cognitivediary.exception;

public class AiSynthesisException extends CognitiveDiaryException {
    private static final long serialVersionUID = 1L;

    public AiSynthesisException(String message) {
        super("AI_SYNTHESIS_ERROR", message);
    }

    public AiSynthesisException(String message, Throwable cause) {
        super("AI_SYNTHESIS_ERROR", message, cause);
    }
}
