package cl.furgonapp;
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

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:territory-tests;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=0")
@AutoConfigureMockMvc @ActiveProfiles("test") @DirtiesContext
class TerritoryIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired Repositories r;
  String login(String account) throws Exception {
    return json.readTree(mvc.perform(post("/api/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",account+"@furgonapp.demo","password","FurgonDemo2026!")))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
  }
  @Test void territoryPersistsAndControlsSearchQuotesAndOwnership() throws Exception {
    var driverToken=login("carlos");var guardian=login("maria");
    var driver=r.drivers().findByUserId(r.users().findByEmailIgnoreCase("carlos@furgonapp.demo").orElseThrow().id).orElseThrow();
    var institution=r.institutions().findAll().stream().filter(i->i.name.equals("Colegio San Marcos")).findFirst().orElseThrow();
    var points=List.of(Map.of("latitude",-33.51,"longitude",-70.62),Map.of("latitude",-33.51,"longitude",-70.58),Map.of("latitude",-33.47,"longitude",-70.58),Map.of("latitude",-33.47,"longitude",-70.62));
    var body=new HashMap<String,Object>(Map.of("region","Región Metropolitana","communes",List.of(),"institutionIds",List.of(institution.id),"territory",points));
    String url="/api/drivers/"+driver.id+"/coverage";
    mvc.perform(put(url).header("Authorization","Bearer "+guardian).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isForbidden());
    body.put("territory",List.of(points.get(0),points.get(2),points.get(1),points.get(3)));
    mvc.perform(put(url).header("Authorization","Bearer "+driverToken).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    body.put("territory",points);
    mvc.perform(put(url).header("Authorization","Bearer "+driverToken).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk());
    mvc.perform(get("/api/workspace").header("Authorization","Bearer "+driverToken)).andExpect(status().isOk()).andExpect(jsonPath("$.drivers[0].territory.length()").value(4));
    String search="/api/search/drivers?institutionId="+institution.id+"&commune=Macul";
    mvc.perform(get(search+"&latitude=-33.49&longitude=-70.60").header("Authorization","Bearer "+guardian)).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(driver.id.toString()));
    mvc.perform(get(search+"&latitude=-33.46&longitude=-70.60").header("Authorization","Bearer "+guardian)).andExpect(status().isOk()).andExpect(jsonPath("$[*].id").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(driver.id.toString()))));
    mvc.perform(get(search).header("Authorization","Bearer "+guardian)).andExpect(status().isOk()).andExpect(jsonPath("$[*].id").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(driver.id.toString()))));
    mvc.perform(post("/api/guardians/me/institutions/"+institution.id).header("Authorization","Bearer "+guardian)).andExpect(status().isOk());
    var quote=new HashMap<String,Object>(Map.of("driverId",driver.id,"institutionId",institution.id,"address","Los Plátanos 1234, Macul","commune","Macul","latitude",-33.46,"longitude",-70.60));
    mvc.perform(post("/api/quotes").header("Authorization","Bearer "+guardian).contentType("application/json").content(json.writeValueAsString(quote))).andExpect(status().isConflict());
    quote.put("latitude",-33.49);
    mvc.perform(post("/api/quotes").header("Authorization","Bearer "+guardian).contentType("application/json").content(json.writeValueAsString(quote))).andExpect(status().isCreated());
  }
}

