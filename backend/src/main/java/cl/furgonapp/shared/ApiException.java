package cl.furgonapp.shared;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

  public final HttpStatus status;

  public ApiException(HttpStatus s, String m) {
    super(m);
    status = s;
  }

  public static ApiException bad(String m) {
    return new ApiException(HttpStatus.BAD_REQUEST, m);
  }

  public static ApiException forbidden() {
    return new ApiException(
      HttpStatus.FORBIDDEN,
      "No tienes permiso para realizar esta acción."
    );
  }

  public static ApiException missing() {
    return new ApiException(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
  }

  public static ApiException conflict(String m) {
    return new ApiException(HttpStatus.CONFLICT, m);
  }
}
