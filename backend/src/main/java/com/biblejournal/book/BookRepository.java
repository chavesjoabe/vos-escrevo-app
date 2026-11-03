package com.biblejournal.book;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class BookRepository implements PanacheMongoRepository<Book> {

    public List<Book> listAllOrdered() {
        return listAll(Sort.by("orderInTestament").ascending());
    }
}
