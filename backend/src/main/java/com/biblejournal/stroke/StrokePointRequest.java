package com.biblejournal.stroke;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StrokePointRequest(
        @NotNull(message = "positionX must not be null")
        Double positionX,

        @NotNull(message = "positionY must not be null")
        Double positionY,

        @NotNull(message = "pressure must not be null")
        @Min(value = 0, message = "pressure must be greater than or equal to 0")
        @Max(value = 1, message = "pressure must be less than or equal to 1")
        @DecimalMin(value = "0.0", message = "pressure must be greater than or equal to 0.0")
        @DecimalMax(value = "1.0", message = "pressure must be less than or equal to 1.0")
        Double pressure
) {
    public StrokePoint toEntity() {
        return new StrokePoint(this.positionX, this.positionY, this.pressure);
    }
}
