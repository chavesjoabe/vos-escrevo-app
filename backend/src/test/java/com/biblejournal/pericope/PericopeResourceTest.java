package com.biblejournal.pericope;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblejournal.annotation.UserPericopeAnnotation;
import com.biblejournal.annotation.UserPericopeAnnotationRepository;
import com.biblejournal.auth.TokenService;
import com.biblejournal.stroke.Stroke;
import com.biblejournal.stroke.StrokePoint;
import com.biblejournal.user.User;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;

@QuarkusTest
class PericopeResourceTest {

    private static final ObjectId USER_A_ID = new ObjectId("66c5fa000000000000000001");
    private static final ObjectId USER_B_ID = new ObjectId("66c5fa000000000000000002");

    @InjectMock
    PericopeRepository pericopeRepository;

    @InjectMock
    UserPericopeAnnotationRepository annotationRepository;

    @Inject
    TokenService tokenService;

    private String bearerTokenFor(ObjectId userId, String email, String name) {
        User user = new User(name, email, "hashed");
        user.id = userId;
        return "Bearer " + tokenService.generateToken(user);
    }

    @Test
    void shouldReturn401WhenAccessingPericopeWithoutAuthorizationToken() {
        given()
                .when()
                .get("/pericopes/66c5f1111111111111111101")
                .then()
                .statusCode(401);
    }

    @Test
    void shouldIsolateStrokesAndCommentsBetweenDifferentUsers() {
        ObjectId pericopeObjectId = new ObjectId("66c5f1111111111111111101");
        ObjectId bookObjectId = new ObjectId("66c5f0000000000000000041");

        Pericope pericope = new Pericope(
                bookObjectId,
                "A Explicação da Parábola do Semeador",
                "4:10-20",
                7,
                List.of(
                        new Verse(13, "E disse-lhes: Não entendeis esta parábola? Como, pois, entendereis todas as parábolas?"),
                        new Verse(14, "O semeador semeia a palavra.")
                )
        );
        pericope.id = pericopeObjectId;

        Stroke userAHighlight = new Stroke(
                "user-a-highlight-1",
                "marker",
                "#FDE68A",
                18,
                0.5,
                List.of(new StrokePoint(42.5, 118.2, 0.6))
        );
        Stroke userAComment = new Stroke(
                "user-a-comment-1",
                "pencil",
                "#7EB2DD",
                3,
                1.0,
                List.of(new StrokePoint(12.0, 30.4, 0.8))
        );
        UserPericopeAnnotation userAAnnotation = new UserPericopeAnnotation(
                USER_A_ID,
                pericopeObjectId,
                List.of(userAHighlight),
                new CommentPage("2026-08-11", List.of(userAComment))
        );

        when(pericopeRepository.findById(pericopeObjectId)).thenReturn(pericope);
        when(annotationRepository.findByUserIdAndPericopeId(USER_A_ID, pericopeObjectId))
                .thenReturn(Optional.of(userAAnnotation));
        when(annotationRepository.findByUserIdAndPericopeId(USER_B_ID, pericopeObjectId))
                .thenReturn(Optional.empty());

        // User A sees their own strokes and comments
        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .when()
                .get("/pericopes/66c5f1111111111111111101")
                .then()
                .statusCode(200)
                .body("id", equalTo("66c5f1111111111111111101"))
                .body("highlightStrokes", hasSize(1))
                .body("highlightStrokes[0].strokeId", equalTo("user-a-highlight-1"))
                .body("commentPage.date", equalTo("2026-08-11"))
                .body("commentPage.strokes", hasSize(1))
                .body("commentPage.strokes[0].strokeId", equalTo("user-a-comment-1"));

        // User B CANNOT see User A's strokes or comments on the same pericope
        given()
                .header("Authorization", bearerTokenFor(USER_B_ID, "userb@example.com", "User B"))
                .when()
                .get("/pericopes/66c5f1111111111111111101")
                .then()
                .statusCode(200)
                .body("id", equalTo("66c5f1111111111111111101"))
                .body("highlightStrokes", hasSize(0))
                .body("commentPage.strokes", hasSize(0));
    }

    @Test
    void shouldReturn404WhenPericopeNotFound() {
        ObjectId missingObjectId = new ObjectId("66c5f9999999999999999999");
        when(pericopeRepository.findById(missingObjectId)).thenReturn(null);

        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .when()
                .get("/pericopes/66c5f9999999999999999999")
                .then()
                .statusCode(404)
                .body("status", equalTo(404));
    }

    @Test
    void shouldReplaceHighlightStrokesScopedToAuthenticatedUser() {
        ObjectId pericopeObjectId = new ObjectId("66c5f1111111111111111101");
        ObjectId bookObjectId = new ObjectId("66c5f0000000000000000041");

        Pericope pericope = new Pericope(
                bookObjectId,
                "A Parábola do Semeador",
                "4:1-9",
                1,
                List.of(new Verse(14, "O semeador semeia a palavra."))
        );
        pericope.id = pericopeObjectId;

        when(pericopeRepository.findById(pericopeObjectId)).thenReturn(pericope);
        when(annotationRepository.findByUserIdAndPericopeId(USER_A_ID, pericopeObjectId))
                .thenReturn(Optional.empty());

        String requestBody = """
                [
                  {
                    "strokeId": "stroke-uuid-1",
                    "color": "#AFCBFF",
                    "strokeWidth": 18,
                    "opacity": 0.5,
                    "points": [
                      { "positionX": 42.5, "positionY": 118.2, "pressure": 0.6 }
                    ]
                  }
                ]
                """;

        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .put("/pericopes/66c5f1111111111111111101/highlight-strokes")
                .then()
                .statusCode(200)
                .body("highlightStrokes", hasSize(1))
                .body("highlightStrokes[0].strokeId", equalTo("stroke-uuid-1"))
                .body("highlightStrokes[0].tool", equalTo("marker"))
                .body("highlightStrokes[0].color", equalTo("#AFCBFF"))
                .body("highlightStrokes[0].strokeWidth", equalTo(18.0f))
                .body("highlightStrokes[0].opacity", equalTo(0.5f))
                .body("highlightStrokes[0].points[0].positionX", equalTo(42.5f))
                .body("highlightStrokes[0].points[0].positionY", equalTo(118.2f))
                .body("highlightStrokes[0].points[0].pressure", equalTo(0.6f));

        verify(annotationRepository).persist(any(UserPericopeAnnotation.class));
    }

    @Test
    void shouldReplaceCommentPageScopedToAuthenticatedUser() {
        ObjectId pericopeObjectId = new ObjectId("66c5f1111111111111111101");
        ObjectId bookObjectId = new ObjectId("66c5f0000000000000000041");

        Pericope pericope = new Pericope(
                bookObjectId,
                "A Parábola do Semeador",
                "4:1-9",
                1,
                List.of(new Verse(14, "O semeador semeia a palavra."))
        );
        pericope.id = pericopeObjectId;

        UserPericopeAnnotation existingAnnotation = new UserPericopeAnnotation(
                USER_A_ID,
                pericopeObjectId,
                new ArrayList<>(),
                new CommentPage("2026-08-01", new ArrayList<>())
        );

        when(pericopeRepository.findById(pericopeObjectId)).thenReturn(pericope);
        when(annotationRepository.findByUserIdAndPericopeId(USER_A_ID, pericopeObjectId))
                .thenReturn(Optional.of(existingAnnotation));

        String requestBody = """
                {
                  "date": "2026-08-11",
                  "strokes": [
                    {
                      "strokeId": "comment-stroke-1",
                      "tool": "pencil",
                      "color": "#1E4FD8",
                      "strokeWidth": 3,
                      "opacity": 1.0,
                      "points": [
                        { "positionX": 12.0, "positionY": 30.4, "pressure": 0.8 }
                      ]
                    }
                  ],
                  "stickyNotes": [
                    {
                      "noteId": "note-1",
                      "text": "Reflexão sobre a boa terra que dá fruto.",
                      "positionX": 48.0,
                      "positionY": 120.0,
                      "color": "#FEF08A"
                    }
                  ]
                }
                """;

        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .put("/pericopes/66c5f1111111111111111101/comment-page")
                .then()
                .statusCode(200)
                .body("commentPage.date", equalTo("2026-08-11"))
                .body("commentPage.strokes", hasSize(1))
                .body("commentPage.strokes[0].strokeId", equalTo("comment-stroke-1"))
                .body("commentPage.strokes[0].tool", equalTo("pencil"))
                .body("commentPage.strokes[0].color", equalTo("#1E4FD8"))
                .body("commentPage.strokes[0].points[0].pressure", equalTo(0.8f))
                .body("commentPage.stickyNotes", hasSize(1))
                .body("commentPage.stickyNotes[0].noteId", equalTo("note-1"))
                .body("commentPage.stickyNotes[0].text", equalTo("Reflexão sobre a boa terra que dá fruto."))
                .body("commentPage.stickyNotes[0].positionX", equalTo(48.0f))
                .body("commentPage.stickyNotes[0].positionY", equalTo(120.0f))
                .body("commentPage.stickyNotes[0].color", equalTo("#FEF08A"));

        verify(annotationRepository).update(existingAnnotation);
    }

    @Test
    void shouldReturn400WhenStickyNoteExceeds280Characters() {
        String longText = "a".repeat(281);
        String invalidBody = """
                {
                  "date": "2026-08-11",
                  "strokes": [],
                  "stickyNotes": [
                    {
                      "noteId": "note-too-long",
                      "text": "%s",
                      "positionX": 40.0,
                      "positionY": 80.0,
                      "color": "#FEF08A"
                    }
                  ]
                }
                """.formatted(longText);

        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .contentType(ContentType.JSON)
                .body(invalidBody)
                .when()
                .put("/pericopes/66c5f1111111111111111101/comment-page")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldReturn400WhenStrokeValidationFails() {
        String invalidBody = """
                {
                  "date": "2026-08-11",
                  "strokes": [
                    {
                      "strokeId": "comment-stroke-invalid",
                      "tool": "pencil",
                      "color": "#1E4FD8",
                      "strokeWidth": 3,
                      "opacity": 1.0,
                      "points": [
                        { "positionX": 12.0, "positionY": 30.4, "pressure": 1.8 }
                      ]
                    }
                  ]
                }
                """;

        given()
                .header("Authorization", bearerTokenFor(USER_A_ID, "usera@example.com", "User A"))
                .contentType(ContentType.JSON)
                .body(invalidBody)
                .when()
                .put("/pericopes/66c5f1111111111111111101/comment-page")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldReturnRandomInspirationalVerseOfTheDay() {
        given()
                .when()
                .get("/pericopes/verse-of-the-day")
                .then()
                .statusCode(200)
                .body("reference", notNullValue())
                .body("text", notNullValue())
                .body("bookName", notNullValue());
    }
}
