package com.biblejournal.book;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import org.bson.types.ObjectId;

@ApplicationScoped
public class BookService {

    private final BookRepository bookRepository;

    @Inject
    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<BookResponse> listAllBooks() {
        return bookRepository.listAllOrdered()
                .stream()
                .map(BookResponse::fromEntity)
                .toList();
    }

    public BookResponse getBookById(String bookId) {
        Book book = findBookEntityOrThrow(bookId);
        return BookResponse.fromEntity(book);
    }

    public Book findBookEntityOrThrow(String bookId) {
        if (bookId == null || !ObjectId.isValid(bookId)) {
            throw new BookNotFoundException(String.valueOf(bookId));
        }
        ObjectId bookObjectId = new ObjectId(bookId);
        Book book = bookRepository.findById(bookObjectId);
        if (book == null) {
            throw new BookNotFoundException(bookId);
        }
        return book;
    }
}
