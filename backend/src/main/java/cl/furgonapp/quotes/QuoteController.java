package cl.furgonapp.quotes;

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
public class QuoteController {

  private final QuoteService quotes;

  public QuoteController(QuoteService quotes) {
    this.quotes = quotes;
  }

  @PostMapping("/quotes")
  @PreAuthorize("hasAnyRole('APODERADO','ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, UUID> quote(@Valid @RequestBody Requests.QuoteCreate b) {
    return Map.of("id", quotes.create(b).id);
  }

  @PostMapping("/quotes/{id}/review")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public void review(@PathVariable UUID id) {
    quotes.review(id);
  }

  @PostMapping("/quotes/{id}/offer")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public void offer(
    @PathVariable UUID id,
    @Valid @RequestBody Requests.Offer b
  ) {
    quotes.offer(id, b);
  }

  @PostMapping("/quotes/{id}/accept")
  @PreAuthorize("hasAnyRole('APODERADO','ADMIN')")
  public Map<String, UUID> accept(@PathVariable UUID id) {
    return Map.of("id", quotes.accept(id).id);
  }

  @PostMapping("/quotes/{id}/reject")
  @PreAuthorize("hasAnyRole('APODERADO','FURGONISTA','ADMIN')")
  public void reject(@PathVariable UUID id) {
    quotes.reject(id);
  }
}
