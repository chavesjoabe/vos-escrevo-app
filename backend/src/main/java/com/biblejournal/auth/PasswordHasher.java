package com.biblejournal.auth;

import jakarta.enterprise.context.ApplicationScoped;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

@ApplicationScoped
public class PasswordHasher {

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 16;

    private final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String rawPassword) {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        byte[] derivedKey = deriveKey(rawPassword.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
        return ITERATIONS + ":"
                + Base64.getEncoder().encodeToString(salt) + ":"
                + Base64.getEncoder().encodeToString(derivedKey);
    }

    public boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }
        String[] parts = storedHash.split(":");
        if (parts.length != 3) {
            return false;
        }
        try {
            int iterations = Integer.parseInt(parts[0]);
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[2]);
            byte[] candidateHash = deriveKey(
                    rawPassword.toCharArray(),
                    salt,
                    iterations,
                    expectedHash.length * 8
            );
            return MessageDigest.isEqual(expectedHash, candidateHash);
        } catch (Exception exception) {
            return false;
        }
    }

    private byte[] deriveKey(char[] password, byte[] salt, int iterations, int keyLength) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLength);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            return factory.generateSecret(spec).getEncoded();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not hash password using " + ALGORITHM, exception);
        }
    }
}
