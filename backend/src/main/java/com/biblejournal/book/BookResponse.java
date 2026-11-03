package com.biblejournal.book;

public record BookResponse(
        String id,
        String name,
        String abbreviation,
        String testament,
        String description,
        int orderInTestament,
        int pericopeCount
) {
    public static BookResponse fromEntity(Book book) {
        return new BookResponse(
                book.id != null ? book.id.toHexString() : null,
                book.name,
                book.abbreviation,
                book.testament,
                book.description,
                book.orderInTestament,
                book.pericopeCount
        );
    }
}
