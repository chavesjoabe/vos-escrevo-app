package com.biblejournal.stroke;

public class StrokePoint {

    public double positionX;
    public double positionY;
    public double pressure;

    public StrokePoint() {
    }

    public StrokePoint(double positionX, double positionY, double pressure) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.pressure = pressure;
    }
}
