package cl.furgonapp.auth;

import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserRepository users;
  private final JwtEncoder encoder;
  private final PasswordEncoder passwords;
  private final boolean demo;

  public AuthController(
    UserRepository u,
    JwtEncoder e,
    PasswordEncoder p,
    @Value("${app.demo}") boolean d
  ) {
    users = u;
    encoder = e;
    passwords = p;
    demo = d;
  }

  public record Login(
    @Email @NotBlank String email,
    @NotBlank String password
  ) {}

  public record Demo(@NotNull Role role) {}

  @GetMapping("/config")
  public Map<String, Boolean> config() {
    return Map.of("demo", demo);
  }

  @PostMapping("/login")
  public Map<String, Object> login(@Valid @RequestBody Login body) {
    var u = users
      .findByEmailIgnoreCase(body.email())
      .orElseThrow(ApiException::forbidden);
    if (
      !passwords.matches(body.password(), u.passwordHash)
    ) throw ApiException.forbidden();
    return token(u);
  }

  @PostMapping("/demo")
  public Map<String, Object> demo(@Valid @RequestBody Demo body) {
    if (!demo) throw ApiException.missing();
    var email = switch (body.role()) {
      case ADMIN -> "admin@furgonapp.demo";
      case FURGONISTA -> "carlos@furgonapp.demo";
      case APODERADO -> "maria@furgonapp.demo";
      case COLEGIO -> "sanmarcos@furgonapp.demo";
    };
    return token(
      users.findByEmailIgnoreCase(email).orElseThrow(ApiException::missing)
    );
  }

  private Map<String, Object> token(User u) {
    if (!u.active) throw ApiException.forbidden();
    var now = Instant.now();
    var claims = JwtClaimsSet.builder()
      .issuer("furgonapp")
      .subject(u.id.toString())
      .issuedAt(now)
      .expiresAt(now.plusSeconds(28800))
      .claim("role", u.role.name())
      .build();
    return Map.of(
      "token",
      encoder
        .encode(
          JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(),
            claims
          )
        )
        .getTokenValue(),
      "user",
      Views.user(u)
    );
  }
}
