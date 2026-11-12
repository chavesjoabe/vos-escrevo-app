package com.biblejournal.pericope;

public class StickyNote {

    public String noteId;
    public String text;
    public double positionX;
    public double positionY;
    public String color;
    public String updatedAt;

    public StickyNote() {
    }

    public StickyNote(
            String noteId,
            String text,
            double positionX,
            double positionY,
            String color,
            String updatedAt
    ) {
        this.noteId = noteId;
        this.text = text;
        this.positionX = positionX;
        this.positionY = positionY;
        this.color = color;
        this.updatedAt = updatedAt;
    }
}
