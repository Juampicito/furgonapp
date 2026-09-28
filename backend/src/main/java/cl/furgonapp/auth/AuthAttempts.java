package cl.furgonapp.auth;

import cl.furgonapp.shared.ApiException;
import java.util.LinkedHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Per-process abuse control. Behind a proxy, use a shared rate limiter before scaling. */
@Component
public class AuthAttempts {

  private record Counter(long until, int count) {}

  private final LinkedHashMap<String, Counter> attempts = new LinkedHashMap<>();

  public synchronized void check(String key, int limit) {
    var current = attempts.get(key);
    if (
      current != null &&
      current.until > System.currentTimeMillis() &&
      current.count >= limit
    ) throw new ApiException(
      HttpStatus.TOO_MANY_REQUESTS,
      "Demasiados intentos. Espera 15 minutos antes de volver a intentar."
    );
  }

  public synchronized void record(String key) {
    long now = System.currentTimeMillis();
    attempts.entrySet().removeIf(e -> e.getValue().until <= now);
    if (attempts.size() >= 10000 && !attempts.containsKey(key)) attempts.remove(
      attempts.keySet().iterator().next()
    );
    var old = attempts.get(key);
    attempts.put(
      key,
      new Counter(
        old == null ? now + 900000 : old.until,
        old == null ? 1 : old.count + 1
      )
    );
  }
}
