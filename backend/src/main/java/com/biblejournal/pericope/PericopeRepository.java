package com.biblejournal.pericope;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import org.bson.types.ObjectId;

@ApplicationScoped
public class PericopeRepository implements PanacheMongoRepository<Pericope> {

    public List<Pericope> findByBookIdOrdered(ObjectId bookObjectId) {
        return list("bookId", Sort.by("orderInBook").ascending(), bookObjectId);
    }
}
