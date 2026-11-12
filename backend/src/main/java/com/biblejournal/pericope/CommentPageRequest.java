package com.biblejournal.pericope;

import com.biblejournal.stroke.Stroke;
import com.biblejournal.stroke.StrokeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public record CommentPageRequest(
        @NotBlank(message = "date must not be blank")
        String date,

        @NotNull(message = "strokes must not be null")
        List<@Valid StrokeRequest> strokes,

        List<@Valid StickyNoteRequest> stickyNotes
) {
    public CommentPage toEntity() {
        List<Stroke> mappedStrokes = this.strokes.stream()
                .map(strokeRequest -> strokeRequest.toEntity("pencil"))
                .toList();
        List<StickyNote> mappedStickyNotes = this.stickyNotes == null
                ? new ArrayList<>()
                : this.stickyNotes.stream()
                        .map(StickyNoteRequest::toEntity)
                        .toList();
        return new CommentPage(this.date, mappedStrokes, mappedStickyNotes);
    }
}
