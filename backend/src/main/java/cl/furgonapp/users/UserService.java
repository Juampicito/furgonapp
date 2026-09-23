package cl.furgonapp.users;

import cl.furgonapp.auth.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.shared.*;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

  private final Repositories r;
  private final CurrentUser actor;

  public UserService(Repositories r, CurrentUser a) {
    this.r = r;
    actor = a;
  }

  public void update(UUID id, Requests.UserUpdate b) {
    actor.owner(id);
    var u = r.users().findById(id).orElseThrow(ApiException::missing);
    if (
      u.role == Role.FURGONISTA &&
      (!Objects.equals(u.rut, b.rut()) ||
        !Objects.equals(u.firstName, b.firstName()) ||
        !Objects.equals(u.lastName, b.lastName()))
    ) r.drivers()
      .findByUserId(id)
      .ifPresent(d -> {
        var locked = r.drivers().lockById(d.id).orElseThrow();
        locked.status = ProfileStatus.INCOMPLETO;
      });
    u.firstName = b.firstName();
    u.lastName = b.lastName();
    u.rut = b.rut();
    u.phone = b.phone();
    u.email = b.email().toLowerCase();
    u.address = b.address();
  }
}
