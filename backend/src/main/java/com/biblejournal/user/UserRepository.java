package com.biblejournal.user;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheMongoRepository<User> {

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        String normalizedEmail = email.trim().toLowerCase();
        return find("email", normalizedEmail).firstResultOptional();
    }
}
