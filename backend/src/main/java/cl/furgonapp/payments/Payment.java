package cl.furgonapp.payments;

import java.math.BigDecimal;
import java.util.UUID;

public record Payment(
  UUID id,
  UUID subscriptionId,
  BigDecimal amount,
  PaymentStatus status
) {}
