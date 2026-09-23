package cl.furgonapp.pricing;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DemoPricingService implements PricingService {

  public BigDecimal estimate(String commune, UUID institutionId) {
    return new BigDecimal("75000");
  }
}
