package com.biblejournal.user;

public record UserResponse(
        String id,
        String name,
        String email
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.id != null ? user.id.toHexString() : null,
                user.name,
                user.email
        );
    }
}
