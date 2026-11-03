package com.biblejournal.annotation;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class UserPericopeAnnotationRepository implements PanacheMongoRepository<UserPericopeAnnotation> {

    public Optional<UserPericopeAnnotation> findByUserIdAndPericopeId(
            ObjectId userId,
            ObjectId pericopeId
    ) {
        if (userId == null || pericopeId == null) {
            return Optional.empty();
        }
        return find("userId = ?1 and pericopeId = ?2", userId, pericopeId).firstResultOptional();
    }
}
