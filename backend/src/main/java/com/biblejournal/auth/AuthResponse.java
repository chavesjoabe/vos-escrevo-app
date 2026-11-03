package com.biblejournal.auth;

import com.biblejournal.user.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
