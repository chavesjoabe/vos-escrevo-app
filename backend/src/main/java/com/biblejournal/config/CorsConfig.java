package com.biblejournal.config;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Exposes the active CORS configuration managed by Quarkus HTTP CORS filter
 * (see quarkus.http.cors.* in application.properties).
 */
@ApplicationScoped
public class CorsConfig {

    private final boolean corsEnabled;

    public CorsConfig(
            @ConfigProperty(name = "quarkus.http.cors", defaultValue = "true") boolean corsEnabled
    ) {
        this.corsEnabled = corsEnabled;
    }

    public boolean isCorsEnabled() {
        return corsEnabled;
    }
}
