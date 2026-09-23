package cl.furgonapp.auth;

import cl.furgonapp.shared.ApiException;
import cl.furgonapp.users.*;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

  private final UserRepository users;

  public CurrentUser(UserRepository u) {
    users = u;
  }

  public User get() {
    var a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null) throw ApiException.forbidden();
    try {
      var u = users
        .findById(UUID.fromString(a.getName()))
        .orElseThrow(ApiException::forbidden);
      if (!u.active) throw ApiException.forbidden();
      return u;
    } catch (IllegalArgumentException e) {
      throw ApiException.forbidden();
    }
  }

  public void owner(UUID userId) {
    var u = get();
    if (
      u.role != Role.ADMIN && !u.id.equals(userId)
    ) throw ApiException.forbidden();
  }

  public void role(Role r) {
    var u = get();
    if (u.role != r && u.role != Role.ADMIN) throw ApiException.forbidden();
  }
}
