package com.biblejournal.auth;

import com.biblejournal.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class TokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final long TOKEN_TTL_DAYS = 30;

    private final ObjectMapper objectMapper;
    private final byte[] secretKeyBytes;

    @Inject
    public TokenService(
            ObjectMapper objectMapper,
            @ConfigProperty(
                    name = "auth.token.secret",
                    defaultValue = "commented-bible-default-jwt-hmac-secret-key-2026-blivre"
            )
            String tokenSecret
    ) {
        this.objectMapper = objectMapper;
        this.secretKeyBytes = tokenSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(User user) {
        if (user == null || user.id == null) {
            throw new IllegalArgumentException("Cannot generate token for user without id");
        }
        Instant now = Instant.now();
        TokenClaims claims = new TokenClaims(
                user.id.toHexString(),
                user.email,
                user.name,
                now.getEpochSecond(),
                now.plus(TOKEN_TTL_DAYS, ChronoUnit.DAYS).getEpochSecond()
        );
        try {
            byte[] payloadBytes = objectMapper.writeValueAsBytes(claims);
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);
            String signature = sign(encodedPayload);
            return encodedPayload + "." + signature;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to generate authentication token", exception);
        }
    }

    public AuthenticatedUser extractAuthenticatedUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedAccessException("Missing or invalid Authorization Bearer header");
        }
        String rawToken = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (rawToken.isEmpty()) {
            throw new UnauthorizedAccessException("Authentication token is empty");
        }
        return verifyToken(rawToken);
    }

    public AuthenticatedUser verifyToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 2) {
            throw new UnauthorizedAccessException("Malformed authentication token");
        }
        String encodedPayload = parts[0];
        String providedSignature = parts[1];
        String expectedSignature = sign(encodedPayload);

        boolean validSignature = MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                providedSignature.getBytes(StandardCharsets.UTF_8)
        );
        if (!validSignature) {
            throw new UnauthorizedAccessException("Invalid authentication token signature");
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(encodedPayload);
            TokenClaims claims = objectMapper.readValue(payloadBytes, TokenClaims.class);
            long nowEpochSeconds = Instant.now().getEpochSecond();
            if (claims.expiresAt() < nowEpochSeconds) {
                throw new UnauthorizedAccessException("Authentication token has expired");
            }
            if (claims.userId() == null || claims.userId().isBlank()) {
                throw new UnauthorizedAccessException("Authentication token missing user identifier");
            }
            return new AuthenticatedUser(claims.userId(), claims.email(), claims.name());
        } catch (UnauthorizedAccessException unauthorizedException) {
            throw unauthorizedException;
        } catch (Exception exception) {
            throw new UnauthorizedAccessException("Unable to parse authentication token claims");
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKeyBytes, HMAC_ALGORITHM));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to compute HMAC signature", exception);
        }
    }

    public record TokenClaims(
            String userId,
            String email,
            String name,
            long issuedAt,
            long expiresAt
    ) {
    }
}
