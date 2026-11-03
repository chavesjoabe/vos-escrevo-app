package com.biblejournal.user;

import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.Instant;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.types.ObjectId;

@MongoEntity(collection = "users")
public class User {

    @BsonId
    public ObjectId id;

    public String name;
    public String email;
    public String passwordHash;
    public String createdAt;

    public User() {
    }

    public User(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now().toString();
    }
}
