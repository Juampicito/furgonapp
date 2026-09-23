package cl.furgonapp.administration;

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
public class AdminController {

  private final AdminService admin;

  public AdminController(AdminService admin) {
    this.admin = admin;
  }

  @PatchMapping("/admin/users/{id}/active")
  @PreAuthorize("hasRole('ADMIN')")
  public void active(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.Active b
  ) {
    admin.active(id, b.active());
  }

  @PatchMapping("/admin/documents/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void document(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.Review b
  ) {
    admin.document(id, b);
  }

  @PatchMapping("/admin/drivers/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void approval(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.ProfileReview b
  ) {
    admin.driver(id, b);
  }
}
