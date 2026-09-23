package cl.furgonapp.notifications;

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
public class NotificationController {

  private final Repositories r;
  private final CurrentUser actor;

  public NotificationController(Repositories r, CurrentUser actor) {
    this.r = r;
    this.actor = actor;
  }

  @PostMapping("/notifications/{id}/read")
  @Transactional
  public void read(@PathVariable UUID id) {
    var n = r.notifications().findById(id).orElseThrow(ApiException::missing);
    actor.owner(n.userId);
    n.read = true;
  }
}
