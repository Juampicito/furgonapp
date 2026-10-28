package cl.furgonapp;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.furgonapp.shared.Repositories;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
  "spring.datasource.url=jdbc:h2:mem:institution-location;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=0",
  "app.jwt-secret=institution-location-test-secret-at-least-32-characters",
  "app.bootstrap.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
@DirtiesContext
class InstitutionLocationIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired Repositories r;

  String register(String name, String role) throws Exception {
    var response = mvc.perform(post("/api/auth/register").contentType("application/json")
      .content(json.writeValueAsString(Map.of("email", name + "@example.com", "password", "LocationTest2026!",
        "firstName", "Cuenta", "lastName", "Prueba", "role", role))))
      .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    return json.readTree(response).get("token").asText();
  }

  Map<String, Object> school() {
    var body = new HashMap<String, Object>();
    body.putAll(Map.of("name", "Colegio ubicación", "address", "Avenida Macul 123", "region", "Región Metropolitana",
      "commune", "Macul", "phone", "123456789", "email", "colegio@example.com",
      "primaryColor", "#178A45", "secondaryColor", "#FFFFFF"));
    body.put("placeId", "google-test-place"); body.put("latitude", -33.49); body.put("longitude", -70.60);
    return body;
  }

  @Test void locationIsRequiredValidatedPersistedAndProtected() throws Exception {
    var owner = register("school-location", "COLEGIO");
    var body = school();
    body.remove("placeId");
    mvc.perform(post("/api/institutions").header("Authorization", "Bearer " + owner)
      .contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    body = school(); body.put("latitude", 91);
    mvc.perform(post("/api/institutions").header("Authorization", "Bearer " + owner)
      .contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    body = school(); body.remove("longitude");
    mvc.perform(post("/api/institutions").header("Authorization", "Bearer " + owner)
      .contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    var created = mvc.perform(post("/api/institutions").header("Authorization", "Bearer " + owner)
      .contentType("application/json").content(json.writeValueAsString(school())))
      .andExpect(status().isCreated()).andExpect(jsonPath("$.latitude").value(-33.49))
      .andExpect(jsonPath("$.placeId").value("google-test-place")).andReturn().getResponse().getContentAsString();
    var id = json.readTree(created).get("id").asText();
    assertThat(r.institutions().findById(UUID.fromString(id)).orElseThrow().longitude).isEqualTo(-70.60);
    var other = register("other-school", "COLEGIO");
    mvc.perform(put("/api/institutions/" + id).header("Authorization", "Bearer " + other)
      .contentType("application/json").content(json.writeValueAsString(school()))).andExpect(status().isForbidden());
    var guardian = register("location-family", "APODERADO");
    mvc.perform(get("/api/workspace").header("Authorization", "Bearer " + guardian))
      .andExpect(status().isOk()).andExpect(jsonPath("$.institutions[0].longitude").value(-70.60));
    mvc.perform(post("/api/institutions").header("Authorization", "Bearer " + guardian)
      .contentType("application/json").content(json.writeValueAsString(school()))).andExpect(status().isForbidden());
  }
}
