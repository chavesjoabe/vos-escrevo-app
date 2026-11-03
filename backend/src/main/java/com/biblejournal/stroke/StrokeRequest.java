package com.biblejournal.stroke;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record StrokeRequest(
        @NotBlank(message = "strokeId must not be blank")
        String strokeId,

        String tool,

        @NotBlank(message = "color must not be blank")
        String color,

        @NotNull(message = "strokeWidth must not be null")
        @Positive(message = "strokeWidth must be positive")
        Double strokeWidth,

        @NotNull(message = "opacity must not be null")
        @DecimalMin(value = "0.0", message = "opacity must be greater than or equal to 0.0")
        @DecimalMax(value = "1.0", message = "opacity must be less than or equal to 1.0")
        Double opacity,

        @NotEmpty(message = "points must not be empty")
        List<@Valid StrokePointRequest> points
) {
    public Stroke toEntity(String defaultTool) {
        String resolvedTool = (this.tool == null || this.tool.isBlank()) ? defaultTool : this.tool;
        List<StrokePoint> mappedPoints = this.points.stream()
                .map(StrokePointRequest::toEntity)
                .toList();
        return new Stroke(
                this.strokeId,
                resolvedTool,
                this.color,
                this.strokeWidth,
                this.opacity,
                mappedPoints
        );
    }
}
