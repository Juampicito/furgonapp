package cl.furgonapp.administration;

import cl.furgonapp.auth.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminService {

  private final Repositories r;
  private final CurrentUser actor;
  private final DocumentValidationService validation;

  public AdminService(
    Repositories r,
    CurrentUser a,
    DocumentValidationService v
  ) {
    this.r = r;
    actor = a;
    validation = v;
  }

  public void document(UUID id, Requests.Review body) {
    actor.role(Role.ADMIN);
    var driverId = r
      .documents()
      .findDriverIdById(id)
      .orElseThrow(ApiException::missing);
    var driver = r.drivers().lockById(driverId).orElseThrow();
    var d = r.documents().findById(id).orElseThrow();
    d.status = body.status();
    d.reviewNote = body.note();
    if (body.status() != DocumentStatus.APROBADO) driver.status =
      body.status() == DocumentStatus.RECHAZADO
        ? ProfileStatus.RECHAZADO
        : ProfileStatus.PENDIENTE_VERIFICACION;
  }

  public void driver(UUID id, Requests.ProfileReview body) {
    actor.role(Role.ADMIN);
    var d = r.drivers().lockById(id).orElseThrow(ApiException::missing);
    if (body.status() == ProfileStatus.APROBADO) validation.approve(d);
    else {
      d.status = body.status();
      d.rejectionReason = body.reason();
    }
  }

  public void active(UUID id, boolean active) {
    actor.role(Role.ADMIN);
    if (actor.get().id.equals(id) && !active) throw ApiException.bad(
      "No puedes desactivar tu propia cuenta."
    );
    var u = r.users().findById(id).orElseThrow(ApiException::missing);
    u.active = active;
  }
}
