package com.biblejournal.pericope;

import com.biblejournal.stroke.Stroke;
import java.util.ArrayList;
import java.util.List;

public class CommentPage {

    public String date;
    public List<Stroke> strokes = new ArrayList<>();

    public CommentPage() {
    }

    public CommentPage(String date, List<Stroke> strokes) {
        this.date = date;
        this.strokes = strokes != null ? strokes : new ArrayList<>();
    }
}
