package com.biblejournal.pericope;

public class PericopeNotFoundException extends RuntimeException {

    public PericopeNotFoundException(String pericopeId) {
        super("Pericope not found with id: " + pericopeId);
    }
}
