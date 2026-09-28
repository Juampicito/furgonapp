package cl.furgonapp.auth;

import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.Map;
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
  private final AccountService accounts;
  private final AuthAttempts attempts;
  private final String dummyHash;

  public AuthController(
    UserRepository u,
    JwtEncoder e,
    PasswordEncoder p,
    AccountService accounts,
    AuthAttempts attempts
  ) {
    users = u;
    encoder = e;
    passwords = p;
    this.accounts = accounts;
    this.attempts = attempts;
    dummyHash = passwords.encode(java.util.UUID.randomUUID().toString());
  }

  public record Login(
    @Email @NotBlank @Size(max = 254) String email,
    @NotBlank @Size(max = 72) String password
  ) {}

  @GetMapping("/config")
  public Map<String, Boolean> config() {
    return Map.of("demo", false, "registration", true);
  }

  @PostMapping("/login")
  public Map<String, Object> login(
    @Valid @RequestBody Login body,
    jakarta.servlet.http.HttpServletRequest request
  ) {
    String bucket = "login:" + request.getRemoteAddr();
    attempts.check(bucket, 30);
    var u = users.findByEmailIgnoreCase(body.email().strip()).orElse(null);
    if (
      !passwords.matches(
        body.password(),
        u == null ? dummyHash : u.passwordHash
      ) ||
      u == null ||
      !u.active
    ) {
      attempts.record(bucket);
      throw new ApiException(
        org.springframework.http.HttpStatus.UNAUTHORIZED,
        "Correo o contraseña incorrectos, o cuenta desactivada."
      );
    }
    return token(u);
  }

  @PostMapping("/register")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Map<String, Object> register(
    @Valid @RequestBody AccountService.Registration body,
    jakarta.servlet.http.HttpServletRequest request
  ) {
    String bucket = "register:" + request.getRemoteAddr();
    attempts.check(bucket, 15);
    attempts.record(bucket);
    return token(accounts.register(body));
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
