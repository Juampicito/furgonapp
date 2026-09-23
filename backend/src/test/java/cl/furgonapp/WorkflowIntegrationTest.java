package cl.furgonapp;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.furgonapp.contracts.ContractStatus;
import cl.furgonapp.documents.DocumentType;
import cl.furgonapp.shared.Repositories;
import cl.furgonapp.users.Role;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkflowIntegrationTest {

  @Autowired
  MockMvc mvc;

  @Autowired
  ObjectMapper json;

  @Autowired
  Repositories r;

  String token(Role role) throws Exception {
    return json
      .readTree(
        mvc
          .perform(
            post("/api/auth/demo")
              .contentType("application/json")
              .content(json.writeValueAsString(Map.of("role", role)))
          )
          .andExpect(status().isOk())
          .andReturn()
          .getResponse()
          .getContentAsString()
      )
      .get("token")
      .asText();
  }

  String login(String email) throws Exception {
    return json
      .readTree(
        mvc
          .perform(
            post("/api/auth/login")
              .contentType("application/json")
              .content(
                json.writeValueAsString(
                  Map.of("email", email, "password", "FurgonDemo2026!")
                )
              )
          )
          .andExpect(status().isOk())
          .andReturn()
          .getResponse()
          .getContentAsString()
      )
      .get("token")
      .asText();
  }

  UUID driver() {
    return r
      .drivers()
      .findByUserId(
        r
          .users()
          .findByEmailIgnoreCase("carlos@furgonapp.demo")
          .orElseThrow()
          .id
      )
      .orElseThrow()
      .id;
  }

  UUID school() {
    return r
      .institutions()
      .findAll()
      .stream()
      .filter(i -> i.name.equals("Colegio San Marcos"))
      .findFirst()
      .orElseThrow()
      .id;
  }

  JsonNode workspace(String token) throws Exception {
    return json.readTree(
      mvc
        .perform(
          get("/api/workspace").header("Authorization", "Bearer " + token)
        )
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString()
    );
  }

  UUID quote(String guardian) throws Exception {
    mvc
      .perform(
        post("/api/guardians/me/institutions/" + school()).header(
          "Authorization",
          "Bearer " + guardian
        )
      )
      .andExpect(status().isOk());
    return UUID.fromString(
      json
        .readTree(
          mvc
            .perform(
              post("/api/quotes")
                .header("Authorization", "Bearer " + guardian)
                .contentType("application/json")
                .content(
                  json.writeValueAsString(
                    Map.of(
                      "driverId",
                      driver(),
                      "institutionId",
                      school(),
                      "address",
                      "Los Plátanos 1234",
                      "commune",
                      "Macul"
                    )
                  )
                )
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString()
        )
        .get("id")
        .asText()
    );
  }

  void offer(UUID id, String driver, int price, int statusCode)
    throws Exception {
    mvc
      .perform(
        post("/api/quotes/" + id + "/offer")
          .header("Authorization", "Bearer " + driver)
          .contentType("application/json")
          .content("{\"monthlyPrice\":" + price + "}")
      )
      .andExpect(status().is(statusCode));
  }

  int accept(UUID id, String guardian) throws Exception {
    return mvc
      .perform(
        post("/api/quotes/" + id + "/accept").header(
          "Authorization",
          "Bearer " + guardian
        )
      )
      .andReturn()
      .getResponse()
      .getStatus();
  }

  @Test
  @Transactional
  void fullWorkflowReservesExactlyOneSeatAndNotifiesBothParties()
    throws Exception {
    String guardian = token(Role.APODERADO),
      driver = token(Role.FURGONISTA);
    var vehicle = r.vehicles().findByDriverId(driver()).orElseThrow();
    long before = r
      .contracts()
      .countByVehicleIdAndStatus(vehicle.id, ContractStatus.ACTIVO);
    UUID q = quote(guardian);
    offer(q, driver, 78000, 200);
    assertThat(accept(q, guardian)).isEqualTo(200);
    assertThat(
      r.contracts().countByVehicleIdAndStatus(vehicle.id, ContractStatus.ACTIVO)
    ).isEqualTo(before + 1);
    assertThat(r.contracts().existsByQuoteId(q)).isTrue();
    assertThat(workspace(guardian).get("notifications").toString()).contains(
      "Contrato activo"
    );
    assertThat(workspace(driver).get("notifications").toString()).contains(
      "Oferta aceptada"
    );
    assertThat(
      workspace(token(Role.ADMIN)).get("contracts").toString()
    ).contains(q.toString());
  }

  @Test
  @Transactional
  void acceptedQuoteCannotCreateASecondContract() throws Exception {
    String guardian = token(Role.APODERADO);
    UUID q = quote(guardian);
    offer(q, token(Role.FURGONISTA), 75000, 200);
    assertThat(accept(q, guardian)).isEqualTo(200);
    assertThat(accept(q, guardian)).isEqualTo(409);
  }

  @Test
  @Transactional
  void priceCeilingAndPositiveIntegerAmountAreEnforced() throws Exception {
    UUID q = quote(token(Role.APODERADO));
    String driver = token(Role.FURGONISTA);
    offer(q, driver, 93751, 400);
    offer(q, driver, 0, 400);
    offer(q, driver, 93750, 200);
  }

  @Test
  @Transactional
  void searchExcludesPendingFullWrongAreaAndInactiveDrivers() throws Exception {
    String guardian = token(Role.APODERADO);
    var result = json.readTree(
      mvc
        .perform(
          get("/api/search/drivers")
            .param("institutionId", school().toString())
            .param("commune", "Macul")
            .header("Authorization", "Bearer " + guardian)
        )
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString()
    );
    assertThat(result.size()).isEqualTo(2);
    assertThat(result.toString())
      .contains("Carlos", "Patricia")
      .doesNotContain("Andrea", "Rodrigo", "rut", "passwordHash", "content");
    mvc
      .perform(
        get("/api/search/drivers")
          .param("institutionId", school().toString())
          .param("commune", "Maipú")
          .header("Authorization", "Bearer " + guardian)
      )
      .andExpect(status().isOk())
      .andExpect(content().json("[]"));
    var u = r
      .users()
      .findByEmailIgnoreCase("carlos@furgonapp.demo")
      .orElseThrow();
    u.active = false;
    r.users().saveAndFlush(u);
    var after = mvc
      .perform(
        get("/api/search/drivers")
          .param("institutionId", school().toString())
          .param("commune", "Macul")
          .header("Authorization", "Bearer " + guardian)
      )
      .andReturn()
      .getResponse()
      .getContentAsString();
    assertThat(after).doesNotContain("Carlos");
  }

  @Test
  @Transactional
  void privateDocumentsAndRoleActionsAreProtected() throws Exception {
    UUID document = r.documents().findByDriverId(driver()).get(0).id;
    mvc
      .perform(
        get("/api/documents/" + document + "/content").header(
          "Authorization",
          "Bearer " + token(Role.APODERADO)
        )
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/documents/" + document + "/content").header(
          "Authorization",
          "Bearer " + login("patricia@furgonapp.demo")
        )
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/documents/" + document + "/content").header(
          "Authorization",
          "Bearer " + token(Role.FURGONISTA)
        )
      )
      .andExpect(status().isOk());
    mvc.perform(get("/api/workspace")).andExpect(status().isUnauthorized());
    UUID q = quote(token(Role.APODERADO));
    offer(q, token(Role.APODERADO), 75000, 403);
    offer(q, login("patricia@furgonapp.demo"), 75000, 403);
    assertThat(workspace(token(Role.COLEGIO)).get("quotes").size()).isZero();
  }

  @Test
  @Transactional
  void guardianCanSaveMoreThanOneInstitutionIdempotently() throws Exception {
    String guardian = token(Role.APODERADO);
    for (var i : r.institutions().findAll())
      for (int n = 0; n < 2; n++) mvc
        .perform(
          post("/api/guardians/me/institutions/" + i.id).header(
            "Authorization",
            "Bearer " + guardian
          )
        )
        .andExpect(status().isOk());
    assertThat(workspace(guardian).get("savedInstitutionIds").size()).isEqualTo(
      2
    );
  }

  @Test
  @Transactional
  void capacityCannotBeReducedBelowActiveContracts() throws Exception {
    var v = r.vehicles().findByDriverId(driver()).orElseThrow();
    mvc
      .perform(
        put("/api/drivers/" + driver() + "/vehicle")
          .header("Authorization", "Bearer " + token(Role.FURGONISTA))
          .contentType("application/json")
          .content(
            json.writeValueAsString(
              Map.of(
                "plate",
                v.plate,
                "brand",
                v.brand,
                "model",
                v.model,
                "manufactureYear",
                v.manufactureYear,
                "color",
                v.color,
                "capacity",
                11,
                "photoId",
                v.photoId
              )
            )
          )
      )
      .andExpect(status().isConflict());
  }

  @Test
  @Transactional
  void rejectedDocumentInvalidatesPublicApproval() throws Exception {
    var doc = r.documents().findByDriverId(driver()).get(0);
    mvc
      .perform(
        patch("/api/admin/documents/" + doc.id)
          .header("Authorization", "Bearer " + token(Role.ADMIN))
          .contentType("application/json")
          .content("{\"status\":\"RECHAZADO\",\"note\":\"Ilegible\"}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        get("/api/drivers/" + driver()).header(
          "Authorization",
          "Bearer " + token(Role.APODERADO)
        )
      )
      .andExpect(status().isNotFound());
    mvc
      .perform(
        patch("/api/admin/drivers/" + driver())
          .header("Authorization", "Bearer " + token(Role.ADMIN))
          .contentType("application/json")
          .content("{\"status\":\"APROBADO\"}")
      )
      .andExpect(status().isBadRequest());
  }

  @Test
  @Transactional
  void uploadRequiresReviewBeforeApproval() throws Exception {
    String driver = token(Role.FURGONISTA),
      admin = token(Role.ADMIN);
    var file = new MockMultipartFile(
      "file",
      "licencia.pdf",
      "application/pdf",
      "%PDF-1.4 demo".getBytes()
    );
    var uploaded = json.readTree(
      mvc
        .perform(
          multipart("/api/drivers/" + driver() + "/documents")
            .file(file)
            .param("type", "LICENCIA")
            .header("Authorization", "Bearer " + driver)
        )
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString()
    );
    assertThat(uploaded.get("status").asText()).isEqualTo("PENDIENTE");
    mvc
      .perform(
        post("/api/drivers/" + driver() + "/submit").header(
          "Authorization",
          "Bearer " + driver
        )
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        patch("/api/admin/documents/" + uploaded.get("id").asText())
          .header("Authorization", "Bearer " + admin)
          .contentType("application/json")
          .content("{\"status\":\"APROBADO\"}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        patch("/api/admin/drivers/" + driver())
          .header("Authorization", "Bearer " + admin)
          .contentType("application/json")
          .content("{\"status\":\"APROBADO\"}")
      )
      .andExpect(status().isOk());
  }

  @Test
  @Transactional
  void deactivationBlocksAnAlreadyIssuedJwt() throws Exception {
    String driver = token(Role.FURGONISTA);
    UUID id = r
      .users()
      .findByEmailIgnoreCase("carlos@furgonapp.demo")
      .orElseThrow()
      .id;
    mvc
      .perform(
        patch("/api/admin/users/" + id + "/active")
          .header("Authorization", "Bearer " + token(Role.ADMIN))
          .contentType("application/json")
          .content("{\"active\":false}")
      )
      .andExpect(status().isOk());
    mvc
      .perform(
        get("/api/workspace").header("Authorization", "Bearer " + driver)
      )
      .andExpect(status().isForbidden());
  }

  @Test
  @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
  void simultaneousAcceptancesCannotOverbookTheLastSeat() throws Exception {
    var v = r.vehicles().findByDriverId(driver()).orElseThrow();
    v.capacity = 13;
    r.vehicles().saveAndFlush(v);
    String guardian = token(Role.APODERADO),
      driverToken = token(Role.FURGONISTA);
    UUID q1 = quote(guardian),
      q2 = quote(guardian);
    offer(q1, driverToken, 75000, 200);
    offer(q2, driverToken, 75000, 200);
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    var executor = Executors.newFixedThreadPool(2);
    try {
      List<Future<Integer>> futures = new ArrayList<>();
      for (UUID q : List.of(q1, q2))
        futures.add(
          executor.submit(() -> {
            ready.countDown();
            start.await();
            return accept(q, guardian);
          })
        );
      assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
      start.countDown();
      var results = List.of(
        futures.get(0).get(15, TimeUnit.SECONDS),
        futures.get(1).get(15, TimeUnit.SECONDS)
      );
      assertThat(results).containsExactlyInAnyOrder(200, 409);
      assertThat(
        r.contracts().countByVehicleIdAndStatus(v.id, ContractStatus.ACTIVO)
      ).isEqualTo(13);
    } finally {
      executor.shutdownNow();
    }
  }
}
