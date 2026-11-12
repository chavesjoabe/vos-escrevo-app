package com.biblejournal.pericope;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record StickyNoteRequest(
        @NotBlank(message = "noteId must not be blank")
        String noteId,

        @NotBlank(message = "text must not be blank")
        @Size(max = 280, message = "text must not exceed 280 characters")
        String text,

        @NotNull(message = "positionX must not be null")
        @DecimalMin(value = "0.0", message = "positionX must be >= 0")
        @DecimalMax(value = "480.0", message = "positionX must be <= 480")
        Double positionX,

        @NotNull(message = "positionY must not be null")
        @DecimalMin(value = "0.0", message = "positionY must be >= 0")
        Double positionY,

        @NotBlank(message = "color must not be blank")
        String color,

        String updatedAt
) {
    public StickyNote toEntity() {
        String resolvedUpdatedAt = (this.updatedAt == null || this.updatedAt.isBlank())
                ? Instant.now().toString()
                : this.updatedAt;
        return new StickyNote(
                this.noteId,
                this.text,
                this.positionX,
                this.positionY,
                this.color,
                resolvedUpdatedAt
        );
    }
}
