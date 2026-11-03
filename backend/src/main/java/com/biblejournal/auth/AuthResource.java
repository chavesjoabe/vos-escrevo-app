package com.biblejournal.auth;

import com.biblejournal.user.UserResponse;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    private final AuthService authService;

    @Inject
    public AuthResource(AuthService authService) {
        this.authService = authService;
    }

    @POST
    @Path("/register")
    public AuthResponse register(
            @NotNull(message = "registerRequest must not be null")
            @Valid RegisterRequest registerRequest
    ) {
        return authService.register(registerRequest);
    }

    @POST
    @Path("/login")
    public AuthResponse login(
            @NotNull(message = "loginRequest must not be null")
            @Valid LoginRequest loginRequest
    ) {
        return authService.login(loginRequest);
    }

    @GET
    @Path("/me")
    public UserResponse getCurrentUser(
            @HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        return authService.getAuthenticatedProfile(authorizationHeader);
    }
}
