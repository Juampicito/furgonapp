package cl.furgonapp.pricing;

import java.math.BigDecimal;
import java.util.UUID;

public interface PricingService {
  BigDecimal estimate(String commune, UUID institutionId);
}
