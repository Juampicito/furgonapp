package cl.furgonapp.drivers;

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
public class DriverController {

  private final Repositories r;
  private final CurrentUser actor;
  private final DriverService drivers;

  public DriverController(
    Repositories r,
    CurrentUser actor,
    DriverService drivers
  ) {
    this.r = r;
    this.actor = actor;
    this.drivers = drivers;
  }

  @PutMapping("/drivers/{id}")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public void driver(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.DriverUpdate b
  ) {
    drivers.update(id, b);
  }

  @PostMapping("/drivers/{id}/submit")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public void submit(@PathVariable UUID id) {
    drivers.submit(id);
  }

  @GetMapping("/search/drivers")
  @PreAuthorize("hasAnyRole('APODERADO','ADMIN')")
  public List<Views.DriverView> search(
    @RequestParam UUID institutionId,
    @RequestParam String commune
  ) {
    return drivers.search(institutionId, commune);
  }

  @GetMapping("/drivers/{id}")
  @Transactional(readOnly = true)
  public Views.DriverView publicDriver(@PathVariable UUID id) {
    var u = actor.get();
    var d = r.drivers().findById(id).orElseThrow(ApiException::missing);
    if (
      u.role != Role.ADMIN &&
      !u.id.equals(d.userId) &&
      (d.status != ProfileStatus.APROBADO ||
        !r.users().findById(d.userId).orElseThrow().active)
    ) throw ApiException.missing();
    return drivers.view(d);
  }
}
