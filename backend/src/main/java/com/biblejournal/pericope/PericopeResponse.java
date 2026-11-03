package com.biblejournal.pericope;

import com.biblejournal.annotation.UserPericopeAnnotation;
import com.biblejournal.stroke.Stroke;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public record PericopeResponse(
        String id,
        String bookId,
        String title,
        String reference,
        int orderInBook,
        List<Verse> verses,
        List<Stroke> highlightStrokes,
        CommentPage commentPage
) {
    public static PericopeResponse fromEntity(
            Pericope pericope,
            UserPericopeAnnotation userAnnotation
    ) {
        List<Stroke> resolvedHighlights = userAnnotation != null && userAnnotation.highlightStrokes != null
                ? userAnnotation.highlightStrokes
                : new ArrayList<>();
        CommentPage resolvedCommentPage = userAnnotation != null && userAnnotation.commentPage != null
                ? userAnnotation.commentPage
                : new CommentPage(LocalDate.now().toString(), new ArrayList<>());

        return new PericopeResponse(
                pericope.id != null ? pericope.id.toHexString() : null,
                pericope.bookId != null ? pericope.bookId.toHexString() : null,
                pericope.title,
                pericope.reference,
                pericope.orderInBook,
                pericope.verses,
                resolvedHighlights,
                resolvedCommentPage
        );
    }
}
