package cl.furgonapp.shared;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ErrorHandler {

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> api(ApiException e) {
    return ResponseEntity.status(e.status).body(
      Map.of("message", e.getMessage())
    );
  }

  @ExceptionHandler(
    org.springframework.web.bind.MethodArgumentNotValidException.class
  )
  ResponseEntity<?> validation(
    org.springframework.web.bind.MethodArgumentNotValidException e
  ) {
    return ResponseEntity.badRequest().body(
      Map.of(
        "message",
        "Revisa los campos del formulario.",
        "errors",
        e
          .getBindingResult()
          .getFieldErrors()
          .stream()
          .map(x -> x.getField() + ": " + x.getDefaultMessage())
          .toList()
      )
    );
  }

  @ExceptionHandler({
    org.springframework.dao.DataIntegrityViolationException.class,
    org.springframework.dao.CannotAcquireLockException.class,
  })
  ResponseEntity<?> conflict(Exception e) {
    return ResponseEntity.status(409).body(
      Map.of(
        "message",
        "La operación entra en conflicto con los datos actuales. Actualiza e inténtalo nuevamente."
      )
    );
  }

  @ExceptionHandler(
    org.springframework.security.access.AccessDeniedException.class
  )
  ResponseEntity<?> forbidden() {
    return ResponseEntity.status(403).body(
      Map.of("message", "No tienes permiso para realizar esta acción.")
    );
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    org.springframework.web.multipart.MaxUploadSizeExceededException.class,
  })
  ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest().body(
      Map.of(
        "message",
        "Solicitud inválida. Comprueba los datos y el tamaño del archivo (máximo 5 MB)."
      )
    );
  }
}
