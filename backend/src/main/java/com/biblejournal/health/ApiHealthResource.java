package com.biblejournal.health;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/health")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
public class ApiHealthResource {

    @Inject
    HealthResource healthResource;

    @GET
    public Response checkHealth() {
        return healthResource.checkHealth();
    }

    @GET
    @Path("/live")
    public Response checkLiveness() {
        return healthResource.checkLiveness();
    }
}
