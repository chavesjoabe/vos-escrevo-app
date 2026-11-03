package com.biblejournal.health;

import java.util.Map;

public record HealthResponse(
        String status,
        String service,
        String timestamp,
        Map<String, String> checks
) {
}
