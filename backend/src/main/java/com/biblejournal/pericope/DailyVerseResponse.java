package com.biblejournal.pericope;

public record DailyVerseResponse(
        String bookName,
        String bookAbbreviation,
        int chapterNumber,
        int verseNumber,
        String reference,
        String text,
        String theme
) {
}
