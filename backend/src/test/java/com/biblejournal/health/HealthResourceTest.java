package com.biblejournal.health;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.bson.Document;
import org.junit.jupiter.api.Test;

@QuarkusTest
class HealthResourceTest {

    @InjectMock
    MongoClient mongoClient;

    @Test
    void shouldReturnHealthStatusUpWhenDatabaseIsHealthy() {
        MongoDatabase mockDb = mock(MongoDatabase.class);
        when(mongoClient.getDatabase("admin")).thenReturn(mockDb);
        when(mockDb.runCommand(any(Document.class))).thenReturn(new Document("ok", 1.0));

        given()
                .contentType(ContentType.JSON)
                .when().get("/health")
                .then()
                .statusCode(200)
                .body("status", is("UP"))
                .body("service", is("commented-bible-backend"))
                .body("timestamp", notNullValue())
                .body("checks.database", is("UP"));
    }

    @Test
    void shouldReturnApiHealthStatusUp() {
        MongoDatabase mockDb = mock(MongoDatabase.class);
        when(mongoClient.getDatabase("admin")).thenReturn(mockDb);
        when(mockDb.runCommand(any(Document.class))).thenReturn(new Document("ok", 1.0));

        given()
                .contentType(ContentType.JSON)
                .when().get("/api/health")
                .then()
                .statusCode(200)
                .body("status", is("UP"))
                .body("checks.database", is("UP"));
    }

    @Test
    void shouldReturnLivenessStatusUpWithoutDatabaseCheck() {
        given()
                .contentType(ContentType.JSON)
                .when().get("/health/live")
                .then()
                .statusCode(200)
                .body("status", is("UP"))
                .body("checks.application", is("UP"));
    }

    @Test
    void shouldReturnServiceUnavailableWhenDatabaseFails() {
        when(mongoClient.getDatabase("admin")).thenThrow(new RuntimeException("Connection timeout"));

        given()
                .contentType(ContentType.JSON)
                .when().get("/health")
                .then()
                .statusCode(503)
                .body("status", is("DOWN"))
                .body("checks.database", is("DOWN"));
    }
}
