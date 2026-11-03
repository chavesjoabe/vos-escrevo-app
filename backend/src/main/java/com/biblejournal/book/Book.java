package com.biblejournal.book;

import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.types.ObjectId;

@MongoEntity(collection = "books")
public class Book {

    @BsonId
    public ObjectId id;

    public String name;
    public String abbreviation;
    public String testament;
    public String description;
    public int orderInTestament;
    public int pericopeCount;

    public Book() {
    }

    public Book(
            String name,
            String abbreviation,
            String testament,
            String description,
            int orderInTestament,
            int pericopeCount
    ) {
        this.name = name;
        this.abbreviation = abbreviation;
        this.testament = testament;
        this.description = description;
        this.orderInTestament = orderInTestament;
        this.pericopeCount = pericopeCount;
    }
}
