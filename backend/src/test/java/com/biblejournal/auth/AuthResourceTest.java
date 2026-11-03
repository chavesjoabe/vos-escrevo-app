package com.biblejournal.auth;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblejournal.user.User;
import com.biblejournal.user.UserRepository;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;

@QuarkusTest
class AuthResourceTest {

    @InjectMock
    UserRepository userRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Test
    void shouldRegisterNewUserAndReturnToken() {
        when(userRepository.findByEmail("joabe@example.com")).thenReturn(Optional.empty());

        String registerPayload = """
                {
                  "name": "Joabe Chaves",
                  "email": "joabe@example.com",
                  "password": "secretPassword123"
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(registerPayload)
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("user.name", equalTo("Joabe Chaves"))
                .body("user.email", equalTo("joabe@example.com"));

        verify(userRepository).persist(any(User.class));
    }

    @Test
    void shouldLoginWithValidEmailAndPassword() {
        User existingUser = new User(
                "Joabe Chaves",
                "joabe@example.com",
                passwordHasher.hashPassword("secretPassword123")
        );
        existingUser.id = new ObjectId("66c5fa000000000000000001");

        when(userRepository.findByEmail("joabe@example.com")).thenReturn(Optional.of(existingUser));

        String loginPayload = """
                {
                  "email": "joabe@example.com",
                  "password": "secretPassword123"
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("user.id", equalTo("66c5fa000000000000000001"))
                .body("user.email", equalTo("joabe@example.com"));
    }

    @Test
    void shouldReturn401WhenPasswordIsInvalid() {
        User existingUser = new User(
                "Joabe Chaves",
                "joabe@example.com",
                passwordHasher.hashPassword("secretPassword123")
        );
        existingUser.id = new ObjectId("66c5fa000000000000000001");

        when(userRepository.findByEmail("joabe@example.com")).thenReturn(Optional.of(existingUser));

        String invalidLoginPayload = """
                {
                  "email": "joabe@example.com",
                  "password": "wrongPassword"
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(invalidLoginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(401);
    }
}
