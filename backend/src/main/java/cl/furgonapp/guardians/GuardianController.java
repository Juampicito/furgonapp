package cl.furgonapp.guardians;

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
public class GuardianController {

  private final InstitutionService institutions;

  public GuardianController(InstitutionService institutions) {
    this.institutions = institutions;
  }

  @PostMapping("/guardians/me/institutions/{id}")
  @PreAuthorize("hasAnyRole('APODERADO','ADMIN')")
  public void saveInstitution(@PathVariable UUID id) {
    institutions.saveForGuardian(id);
  }

  @DeleteMapping("/guardians/me/institutions/{id}")
  @PreAuthorize("hasAnyRole('APODERADO','ADMIN')")
  public void removeInstitution(@PathVariable UUID id) {
    institutions.removeForGuardian(id);
  }
}
