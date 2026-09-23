package cl.furgonapp.coverage;

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
public class CoverageController {

  private final DriverService drivers;

  public CoverageController(DriverService drivers) {
    this.drivers = drivers;
  }

  @PutMapping("/drivers/{id}/coverage")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public void coverage(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.CoverageUpdate b
  ) {
    drivers.coverage(id, b);
  }
}
