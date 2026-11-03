package com.biblejournal.auth;

public record AuthenticatedUser(
        String userId,
        String email,
        String name
) {
}
