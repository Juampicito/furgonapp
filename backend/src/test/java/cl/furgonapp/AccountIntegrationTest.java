package cl.furgonapp;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.furgonapp.drivers.ProfileStatus;
import cl.furgonapp.shared.Repositories;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = {
    "spring.datasource.url=jdbc:h2:mem:accounts;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=0",
    "app.jwt-secret=integration-test-secret-accounts-at-least-32-characters",
    "app.bootstrap.enabled=false",
  }
)
@AutoConfigureMockMvc
@ActiveProfiles("local")
@DirtiesContext
class AccountIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  ObjectMapper json;

  @Autowired
  Repositories r;

  @Autowired
  PasswordEncoder passwords;

  String password = "Una frase segura 2026!";

  Map<String, Object> body(String email, String role) {
    return Map.of(
      "email",
      email,
      "password",
      password,
      "firstName",
      "Nueva",
      "lastName",
      "Cuenta",
      "role",
      role
    );
  }

  String register(String email, String role) throws Exception {
    return mvc
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(json.writeValueAsString(body(email, role)))
      )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
      .andReturn()
      .getResponse()
      .getContentAsString();
  }

  @Test
  void registrationPersistsHashedPasswordAndLoginUsesNormalizedEmail()
    throws Exception {
    register("NEW@EXAMPLE.COM", "APODERADO");
    var user = r.users().findByEmailIgnoreCase("new@example.com").orElseThrow();
    assertThat(user.email).isEqualTo("new@example.com");
    assertThat(user.passwordHash).isNotEqualTo(password);
    assertThat(passwords.matches(password, user.passwordHash)).isTrue();
    mvc
      .perform(
        post("/api/auth/login")
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of("email", "NEW@example.com", "password", password)
            )
          )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.token").isString());
    mvc
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(json.writeValueAsString(body("new@example.com", "COLEGIO")))
      )
      .andExpect(status().isConflict());
  }

  @Test
  void driverStartsIncompleteWithNoFabricatedVehicleOrDocuments()
    throws Exception {
    var response = json.readTree(register("driver@example.com", "FURGONISTA"));
    var driver = r
      .drivers()
      .findByUserId(UUID.fromString(response.at("/user/id").asText()))
      .orElseThrow();
    assertThat(driver.status).isEqualTo(ProfileStatus.INCOMPLETO);
    assertThat(r.vehicles().findByDriverId(driver.id)).isEmpty();
    assertThat(r.documents().findByDriverId(driver.id)).isEmpty();
    mvc
      .perform(
        get("/api/workspace").header(
          "Authorization",
          "Bearer " + response.get("token").asText()
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.drivers[0].status").value("INCOMPLETO"));
  }

  @Test
  void schoolGetsWorkspaceToCreateRealInstitution() throws Exception {
    var response = json.readTree(register("school@example.com", "COLEGIO"));
    mvc
      .perform(
        get("/api/workspace").header(
          "Authorization",
          "Bearer " + response.get("token").asText()
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.user.role").value("COLEGIO"));
  }

  @Test
  void publicCannotCreateAdminOrUseDemoEntry() throws Exception {
    mvc
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(json.writeValueAsString(body("admin@example.com", "ADMIN")))
      )
      .andExpect(status().isForbidden());
    assertThat(r.users().findByEmailIgnoreCase("admin@example.com")).isEmpty();
    mvc
      .perform(
        post("/api/auth/demo")
          .contentType("application/json")
          .content("{\"role\":\"ADMIN\"}")
      )
      .andExpect(result ->
        assertThat(result.getResponse().getStatus()).isIn(401, 404)
      );
  }

  @Test
  void weakPasswordsAndInvalidRolesAreRejected() throws Exception {
    var invalid = new HashMap<>(body("weak@example.com", "APODERADO"));
    invalid.put("password", "123");
    mvc
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(json.writeValueAsString(invalid))
      )
      .andExpect(status().isBadRequest());
    invalid.put("password", password);
    invalid.put("role", "SUPERADMIN");
    mvc
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(json.writeValueAsString(invalid))
      )
      .andExpect(status().isBadRequest());
  }

  @Test
  void disabledUsersCannotLoginOrReuseTheirToken() throws Exception {
    var response = json.readTree(register("disabled@example.com", "APODERADO"));
    var user = r
      .users()
      .findByEmailIgnoreCase("disabled@example.com")
      .orElseThrow();
    user.active = false;
    r.users().saveAndFlush(user);
    mvc
      .perform(
        post("/api/auth/login")
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of("email", user.email, "password", password)
            )
          )
      )
      .andExpect(status().isUnauthorized());
    mvc
      .perform(
        get("/api/workspace").header(
          "Authorization",
          "Bearer " + response.get("token").asText()
        )
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void wrongCredentialsAndCrossRoleAccessFail() throws Exception {
    var response = json.readTree(register("guardian@example.com", "APODERADO"));
    mvc
      .perform(
        post("/api/auth/login")
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of(
                "email",
                "guardian@example.com",
                "password",
                "incorrect-password"
              )
            )
          )
      )
      .andExpect(status().isUnauthorized());
    mvc
      .perform(
        patch(
          "/api/admin/users/" + response.at("/user/id").asText() + "/active"
        )
          .header("Authorization", "Bearer " + response.get("token").asText())
          .contentType("application/json")
          .content("{\"active\":false}")
      )
      .andExpect(status().isForbidden());
  }
}
