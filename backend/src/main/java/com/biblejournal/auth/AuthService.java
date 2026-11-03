package com.biblejournal.auth;

import com.biblejournal.user.User;
import com.biblejournal.user.UserRepository;
import com.biblejournal.user.UserResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.types.ObjectId;

@ApplicationScoped
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final TokenService tokenService;

    @Inject
    public AuthService(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            TokenService tokenService
    ) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
    }

    public AuthResponse register(RegisterRequest registerRequest) {
        String normalizedEmail = registerRequest.email().trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new EmailAlreadyRegisteredException(normalizedEmail);
        }

        String passwordHash = passwordHasher.hashPassword(registerRequest.password());
        User user = new User(registerRequest.name().trim(), normalizedEmail, passwordHash);
        user.id = new ObjectId();
        userRepository.persist(user);

        String token = tokenService.generateToken(user);
        return new AuthResponse(token, UserResponse.fromEntity(user));
    }

    public AuthResponse login(LoginRequest loginRequest) {
        String normalizedEmail = loginRequest.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("E-mail ou senha inválidos."));

        boolean passwordMatches = passwordHasher.verifyPassword(
                loginRequest.password(),
                user.passwordHash
        );
        if (!passwordMatches) {
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");
        }

        String token = tokenService.generateToken(user);
        return new AuthResponse(token, UserResponse.fromEntity(user));
    }

    public UserResponse getAuthenticatedProfile(String authorizationHeader) {
        AuthenticatedUser authenticatedUser = tokenService.extractAuthenticatedUser(authorizationHeader);
        if (!ObjectId.isValid(authenticatedUser.userId())) {
            throw new UnauthorizedAccessException("Invalid user identifier in token.");
        }
        User user = userRepository.findById(new ObjectId(authenticatedUser.userId()));
        if (user == null) {
            throw new UnauthorizedAccessException("Authenticated user not found.");
        }
        return UserResponse.fromEntity(user);
    }
}
