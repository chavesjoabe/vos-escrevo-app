package com.biblejournal.auth;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("An account with email '" + email + "' is already registered.");
    }
}
