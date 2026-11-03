package com.biblejournal.pericope;

import io.quarkus.mongodb.panache.common.MongoEntity;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.types.ObjectId;

@MongoEntity(collection = "pericopes")
public class Pericope {

    @BsonId
    public ObjectId id;

    public ObjectId bookId;
    public String title;
    public String reference;
    public int orderInBook;
    public List<Verse> verses = new ArrayList<>();

    public Pericope() {
    }

    public Pericope(
            ObjectId bookId,
            String title,
            String reference,
            int orderInBook,
            List<Verse> verses
    ) {
        this.bookId = bookId;
        this.title = title;
        this.reference = reference;
        this.orderInBook = orderInBook;
        this.verses = verses != null ? verses : new ArrayList<>();
    }
}
