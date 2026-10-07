package cl.furgonapp;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.furgonapp.documents.DocumentStatus;
import cl.furgonapp.drivers.ProfileStatus;
import cl.furgonapp.shared.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = {
    "spring.datasource.url=jdbc:h2:mem:presentation;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=0",
    "app.jwt-secret=presentation-integration-test-secret-at-least-32-characters",
    "app.bootstrap.enabled=false",
    "app.presentation.enabled=true",
  }
)
@ActiveProfiles("local")
@AutoConfigureMockMvc
@DirtiesContext
class PresentationIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  ObjectMapper json;

  @Autowired
  Repositories r;

  @Autowired
  PresentationData seed;

  String login(String handle) throws Exception {
    var response = mvc
      .perform(
        post("/api/auth/login")
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of(
                "email",
                handle + "@presentacion.local",
                "password",
                handle
              )
            )
          )
      )
      .andExpect(status().isOk())
      .andReturn()
      .getResponse()
      .getContentAsString();
    return json.readTree(response).get("token").asText();
  }

  @Test
  void preparedAccountsCanCompleteWorkflowAndRestartPreservesProgress()
    throws Exception {
    assertThat(r.users().count()).isEqualTo(4);
    login("administrador");
    login("colegioprueba");
    var guardianToken = login("apoderadoprofe");
    var driverToken = login("furgonistaprofe");
    var driver = r.drivers().findAll().get(0);
    var institution = r.institutions().findAll().get(0);
    var vehicle = r.vehicles().findByDriverId(driver.id).orElseThrow();
    assertThat(driver.status).isEqualTo(ProfileStatus.APROBADO);
    assertThat(r.documents().findByDriverId(driver.id))
      .hasSize(5)
      .allMatch(d -> d.status == DocumentStatus.APROBADO);
    assertThat(vehicle.capacity).isEqualTo(16);
    assertThat(r.savedInstitutions().count()).isEqualTo(1);
    assertThat(r.contracts().count()).isZero();
    mvc
      .perform(
        get("/api/search/drivers")
          .param("institutionId", institution.id.toString())
          .param("commune", "Macul")
          .header("Authorization", "Bearer " + guardianToken)
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$[0].id").value(driver.id.toString()));
    var response = mvc
      .perform(
        post("/api/quotes")
          .header("Authorization", "Bearer " + guardianToken)
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of(
                "driverId",
                driver.id,
                "institutionId",
                institution.id,
                "address",
                "Avenida Macul",
                "commune",
                "Macul"
              )
            )
          )
      )
      .andExpect(status().isCreated())
      .andReturn()
      .getResponse()
      .getContentAsString();
    var id = json.readTree(response).get("id").asText();
    mvc
      .perform(
        post("/api/quotes/" + id + "/offer")
          .header("Authorization", "Bearer " + driverToken)
          .contentType("application/json")
          .content("{\"monthlyPrice\":78000}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        post("/api/quotes/" + id + "/accept").header(
          "Authorization",
          "Bearer " + guardianToken
        )
      )
      .andExpect(status().isOk());
    assertThat(r.contracts().count()).isEqualTo(1);
    var passwordHash = r
      .users()
      .findByEmailIgnoreCase("furgonistaprofe@presentacion.local")
      .orElseThrow()
      .passwordHash;
    seed.run();
    assertThat(r.users().count()).isEqualTo(4);
    assertThat(r.contracts().count()).isEqualTo(1);
    assertThat(r.documents().count()).isEqualTo(5);
    assertThat(
      r
        .users()
        .findByEmailIgnoreCase("furgonistaprofe@presentacion.local")
        .orElseThrow()
        .passwordHash
    ).isEqualTo(passwordHash);
  }
}
