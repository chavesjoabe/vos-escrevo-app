package com.biblejournal.pericope;

import com.biblejournal.auth.AuthenticatedUser;
import com.biblejournal.auth.TokenService;
import com.biblejournal.stroke.StrokeRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/pericopes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PericopeResource {

    private final PericopeService pericopeService;
    private final TokenService tokenService;

    @Inject
    public PericopeResource(PericopeService pericopeService, TokenService tokenService) {
        this.pericopeService = pericopeService;
        this.tokenService = tokenService;
    }

    @GET
    @Path("/verse-of-the-day")
    public DailyVerseResponse getRandomVerseOfTheDay() {
        return pericopeService.getRandomInspirationalVerse();
    }

    @GET
    @Path("/{pericopeId}")
    public PericopeResponse getPericopeById(
            @PathParam("pericopeId") String pericopeId,
            @HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        AuthenticatedUser authenticatedUser = tokenService.extractAuthenticatedUser(authorizationHeader);
        return pericopeService.getPericopeByIdForUser(pericopeId, authenticatedUser.userId());
    }

    @PUT
    @Path("/{pericopeId}/highlight-strokes")
    public PericopeResponse replaceHighlightStrokes(
            @PathParam("pericopeId") String pericopeId,
            @HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            @NotNull(message = "strokeRequests must not be null")
            List<@Valid StrokeRequest> strokeRequests
    ) {
        AuthenticatedUser authenticatedUser = tokenService.extractAuthenticatedUser(authorizationHeader);
        return pericopeService.replaceHighlightStrokesForUser(
                pericopeId,
                authenticatedUser.userId(),
                strokeRequests
        );
    }

    @PUT
    @Path("/{pericopeId}/comment-page")
    public PericopeResponse replaceCommentPage(
            @PathParam("pericopeId") String pericopeId,
            @HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            @NotNull(message = "commentPageRequest must not be null")
            @Valid CommentPageRequest commentPageRequest
    ) {
        AuthenticatedUser authenticatedUser = tokenService.extractAuthenticatedUser(authorizationHeader);
        return pericopeService.replaceCommentPageForUser(
                pericopeId,
                authenticatedUser.userId(),
                commentPageRequest
        );
    }
}
