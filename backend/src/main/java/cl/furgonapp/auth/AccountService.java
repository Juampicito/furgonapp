package cl.furgonapp.auth;

import cl.furgonapp.drivers.DriverProfile;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService {

  private final Repositories r;
  private final PasswordEncoder passwords;

  public AccountService(Repositories r, PasswordEncoder passwords) {
    this.r = r;
    this.passwords = passwords;
  }

  public record Registration(
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 12, max = 72) String password,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotNull Role role
  ) {}

  public User register(Registration body) {
    if (body.role() == Role.ADMIN) throw ApiException.forbidden();
    return create(body);
  }

  public User create(Registration body) {
    if (
      body.password().getBytes(StandardCharsets.UTF_8).length > 72 ||
      body.password().length() < 12
    ) throw ApiException.bad(
      "La contraseña debe tener al menos 12 caracteres y no superar 72 bytes."
    );
    var email = body.email().strip().toLowerCase(Locale.ROOT);
    if (
      r.users().findByEmailIgnoreCase(email).isPresent()
    ) throw ApiException.conflict(
      "Ya existe una cuenta con ese correo. Inicia sesión."
    );
    var user = new User();
    user.email = email;
    user.firstName = body.firstName().strip();
    user.lastName = body.lastName().strip();
    user.role = body.role();
    user.passwordHash = passwords.encode(body.password());
    r.users().saveAndFlush(user);
    if (user.role == Role.FURGONISTA) {
      var driver = new DriverProfile();
      driver.userId = user.id;
      r.drivers().save(driver);
    }
    // Schools create their institution after supplying its real details in their panel.
    return user;
  }
}
