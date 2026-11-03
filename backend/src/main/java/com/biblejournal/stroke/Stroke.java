package com.biblejournal.stroke;

import java.util.ArrayList;
import java.util.List;

public class Stroke {

    public String strokeId;
    public String tool;
    public String color;
    public double strokeWidth;
    public double opacity;
    public List<StrokePoint> points = new ArrayList<>();

    public Stroke() {
    }

    public Stroke(
            String strokeId,
            String tool,
            String color,
            double strokeWidth,
            double opacity,
            List<StrokePoint> points
    ) {
        this.strokeId = strokeId;
        this.tool = tool;
        this.color = color;
        this.strokeWidth = strokeWidth;
        this.opacity = opacity;
        this.points = points != null ? points : new ArrayList<>();
    }
}
