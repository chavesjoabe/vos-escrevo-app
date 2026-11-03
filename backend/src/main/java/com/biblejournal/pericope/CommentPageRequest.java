package com.biblejournal.pericope;

import com.biblejournal.stroke.Stroke;
import com.biblejournal.stroke.StrokeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CommentPageRequest(
        @NotBlank(message = "date must not be blank")
        String date,

        @NotNull(message = "strokes must not be null")
        List<@Valid StrokeRequest> strokes
) {
    public CommentPage toEntity() {
        List<Stroke> mappedStrokes = this.strokes.stream()
                .map(strokeRequest -> strokeRequest.toEntity("pencil"))
                .toList();
        return new CommentPage(this.date, mappedStrokes);
    }
}
