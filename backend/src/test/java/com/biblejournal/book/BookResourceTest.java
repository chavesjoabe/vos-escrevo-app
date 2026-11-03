package com.biblejournal.book;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;

import com.biblejournal.pericope.Pericope;
import com.biblejournal.pericope.PericopeRepository;
import com.biblejournal.pericope.Verse;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;

@QuarkusTest
class BookResourceTest {

    @InjectMock
    BookRepository bookRepository;

    @InjectMock
    PericopeRepository pericopeRepository;

    @Test
    void shouldListAllBooksOrderedByTestamentOrder() {
        Book genesis = new Book(
                "Gênesis",
                "Gn",
                "OT",
                "O Livro das Origens — Gênesis",
                1,
                50
        );
        genesis.id = new ObjectId("66c5f0000000000000000001");

        Book marcos = new Book(
                "Marcos",
                "Mc",
                "NT",
                "Evangelho Segundo Marcos",
                41,
                20
        );
        marcos.id = new ObjectId("66c5f0000000000000000041");

        when(bookRepository.listAllOrdered()).thenReturn(List.of(genesis, marcos));

        given()
                .when()
                .get("/books")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("[0].id", equalTo("66c5f0000000000000000001"))
                .body("[0].name", equalTo("Gênesis"))
                .body("[0].orderInTestament", equalTo(1))
                .body("[1].id", equalTo("66c5f0000000000000000041"))
                .body("[1].name", equalTo("Marcos"))
                .body("[1].orderInTestament", equalTo(41));
    }

    @Test
    void shouldListPericopeSummariesForBook() {
        ObjectId bookObjectId = new ObjectId("66c5f0000000000000000041");
        Book marcos = new Book(
                "Marcos",
                "Mc",
                "NT",
                "Evangelho Segundo Marcos",
                41,
                2
        );
        marcos.id = bookObjectId;

        Pericope firstPericope = new Pericope(
                bookObjectId,
                "A Parábola do Semeador",
                "4:1-9",
                1,
                List.of(new Verse(1, "E outra vez começou a ensinar junto ao mar..."))
        );
        firstPericope.id = new ObjectId("66c5f1111111111111111101");

        when(bookRepository.findById(bookObjectId)).thenReturn(marcos);
        when(pericopeRepository.findByBookIdOrdered(bookObjectId)).thenReturn(List.of(firstPericope));

        given()
                .when()
                .get("/books/66c5f0000000000000000041/pericopes")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].id", equalTo("66c5f1111111111111111101"))
                .body("[0].bookId", equalTo("66c5f0000000000000000041"))
                .body("[0].title", equalTo("A Parábola do Semeador"))
                .body("[0].reference", equalTo("4:1-9"))
                .body("[0].orderInBook", equalTo(1));
    }

    @Test
    void shouldReturn404WhenBookDoesNotExist() {
        given()
                .when()
                .get("/books/invalid-object-id/pericopes")
                .then()
                .statusCode(404);
    }
}
