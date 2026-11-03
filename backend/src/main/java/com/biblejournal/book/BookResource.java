package com.biblejournal.book;

import com.biblejournal.pericope.PericopeService;
import com.biblejournal.pericope.PericopeSummaryResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/books")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookResource {

    private final BookService bookService;
    private final PericopeService pericopeService;

    @Inject
    public BookResource(BookService bookService, PericopeService pericopeService) {
        this.bookService = bookService;
        this.pericopeService = pericopeService;
    }

    @GET
    public List<BookResponse> listAllBooks() {
        return bookService.listAllBooks();
    }

    @GET
    @Path("/{bookId}")
    public BookResponse getBookById(@PathParam("bookId") String bookId) {
        return bookService.getBookById(bookId);
    }

    @GET
    @Path("/{bookId}/pericopes")
    public List<PericopeSummaryResponse> listBookPericopes(@PathParam("bookId") String bookId) {
        return pericopeService.listPericopesByBookId(bookId);
    }
}
