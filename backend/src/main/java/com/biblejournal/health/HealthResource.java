package com.biblejournal.health;

import com.mongodb.client.MongoClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.bson.Document;
import org.jboss.logging.Logger;

@Path("/health")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {

    private static final Logger LOGGER = Logger.getLogger(HealthResource.class);
    private static final String SERVICE_NAME = "commented-bible-backend";

    @Inject
    MongoClient mongoClient;

    @GET
    public Response checkHealth() {
        Map<String, String> checks = new LinkedHashMap<>();
        boolean dbHealthy = false;

        try {
            mongoClient.getDatabase("admin").runCommand(new Document("ping", 1));
            checks.put("database", "UP");
            dbHealthy = true;
        } catch (Exception e) {
            LOGGER.error("Health check failed for database: " + e.getMessage());
            checks.put("database", "DOWN");
        }

        String overallStatus = dbHealthy ? "UP" : "DOWN";
        HealthResponse response = new HealthResponse(
                overallStatus,
                SERVICE_NAME,
                Instant.now().toString(),
                checks
        );

        if (dbHealthy) {
            return Response.ok(response).build();
        } else {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE).entity(response).build();
        }
    }

    @GET
    @Path("/live")
    public Response checkLiveness() {
        return Response.ok(new HealthResponse(
                "UP",
                SERVICE_NAME,
                Instant.now().toString(),
                Map.of("application", "UP")
        )).build();
    }
}
