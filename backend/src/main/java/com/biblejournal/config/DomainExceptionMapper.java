package com.biblejournal.config;

import com.biblejournal.auth.EmailAlreadyRegisteredException;
import com.biblejournal.auth.UnauthorizedAccessException;
import com.biblejournal.book.BookNotFoundException;
import com.biblejournal.pericope.PericopeNotFoundException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.time.Instant;

public class DomainExceptionMapper {

    public record ErrorPayload(int status, String error, String message, String timestamp) {
    }

    @Provider
    public static class PericopeNotFoundExceptionMapper
            implements ExceptionMapper<PericopeNotFoundException> {

        @Override
        public Response toResponse(PericopeNotFoundException exception) {
            ErrorPayload payload = new ErrorPayload(
                    Response.Status.NOT_FOUND.getStatusCode(),
                    "Not Found",
                    exception.getMessage(),
                    Instant.now().toString()
            );
            return Response.status(Response.Status.NOT_FOUND)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(payload)
                    .build();
        }
    }

    @Provider
    public static class BookNotFoundExceptionMapper
            implements ExceptionMapper<BookNotFoundException> {

        @Override
        public Response toResponse(BookNotFoundException exception) {
            ErrorPayload payload = new ErrorPayload(
                    Response.Status.NOT_FOUND.getStatusCode(),
                    "Not Found",
                    exception.getMessage(),
                    Instant.now().toString()
            );
            return Response.status(Response.Status.NOT_FOUND)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(payload)
                    .build();
        }
    }

    @Provider
    public static class UnauthorizedAccessExceptionMapper
            implements ExceptionMapper<UnauthorizedAccessException> {

        @Override
        public Response toResponse(UnauthorizedAccessException exception) {
            ErrorPayload payload = new ErrorPayload(
                    Response.Status.UNAUTHORIZED.getStatusCode(),
                    "Unauthorized",
                    exception.getMessage(),
                    Instant.now().toString()
            );
            return Response.status(Response.Status.UNAUTHORIZED)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(payload)
                    .build();
        }
    }

    @Provider
    public static class EmailAlreadyRegisteredExceptionMapper
            implements ExceptionMapper<EmailAlreadyRegisteredException> {

        @Override
        public Response toResponse(EmailAlreadyRegisteredException exception) {
            ErrorPayload payload = new ErrorPayload(
                    Response.Status.CONFLICT.getStatusCode(),
                    "Conflict",
                    exception.getMessage(),
                    Instant.now().toString()
            );
            return Response.status(Response.Status.CONFLICT)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(payload)
                    .build();
        }
    }
}
