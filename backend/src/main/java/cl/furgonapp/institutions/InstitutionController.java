package cl.furgonapp.institutions;

import cl.furgonapp.administration.*;
import cl.furgonapp.auth.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.institutions.*;
import cl.furgonapp.media.*;
import cl.furgonapp.quotes.*;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class InstitutionController {

  private final InstitutionService institutions;

  public InstitutionController(InstitutionService institutions) {
    this.institutions = institutions;
  }

  @PostMapping("/institutions")
  @PreAuthorize("hasAnyRole('COLEGIO','ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public Institution createInstitution(
    @Valid @RequestBody Requests.InstitutionUpdate b
  ) {
    return institutions.save(null, b);
  }

  @PutMapping("/institutions/{id}")
  @PreAuthorize("hasAnyRole('COLEGIO','ADMIN')")
  public Institution institution(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.InstitutionUpdate b
  ) {
    return institutions.save(id, b);
  }
}
