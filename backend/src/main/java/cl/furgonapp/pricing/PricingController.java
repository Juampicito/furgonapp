package cl.furgonapp.pricing;

import cl.furgonapp.auth.CurrentUser;
import cl.furgonapp.institutions.InstitutionRepository;
import cl.furgonapp.shared.ApiException;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

  private final PricingService pricing;
  private final InstitutionRepository institutions;
  private final CurrentUser actor;

  public PricingController(
    PricingService pricing,
    InstitutionRepository institutions,
    CurrentUser actor
  ) {
    this.pricing = pricing;
    this.institutions = institutions;
    this.actor = actor;
  }

  @GetMapping("/estimate")
  public Map<String, BigDecimal> estimate(
    @RequestParam UUID institutionId,
    @RequestParam String commune
  ) {
    actor.get();
    if (!institutions.existsById(institutionId)) throw ApiException.missing();
    if (commune.isBlank()) throw ApiException.bad("Indica una comuna.");
    return Map.of("suggestedPrice", pricing.estimate(commune, institutionId));
  }
}
