package com.biblejournal.annotation;

import com.biblejournal.pericope.CommentPage;
import com.biblejournal.stroke.Stroke;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.types.ObjectId;

@MongoEntity(collection = "user_annotations")
public class UserPericopeAnnotation {

    @BsonId
    public ObjectId id;

    public ObjectId userId;
    public ObjectId pericopeId;
    public List<Stroke> highlightStrokes = new ArrayList<>();
    public CommentPage commentPage = new CommentPage(LocalDate.now().toString(), new ArrayList<>());
    public String updatedAt;

    public UserPericopeAnnotation() {
    }

    public UserPericopeAnnotation(
            ObjectId userId,
            ObjectId pericopeId,
            List<Stroke> highlightStrokes,
            CommentPage commentPage
    ) {
        this.userId = userId;
        this.pericopeId = pericopeId;
        this.highlightStrokes = highlightStrokes != null ? highlightStrokes : new ArrayList<>();
        this.commentPage = commentPage != null
                ? commentPage
                : new CommentPage(LocalDate.now().toString(), new ArrayList<>());
        this.updatedAt = Instant.now().toString();
    }
}
