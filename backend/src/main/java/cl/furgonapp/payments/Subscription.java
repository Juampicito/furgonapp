package cl.furgonapp.payments;

import java.util.UUID;

public record Subscription(UUID id, UUID contractId, PaymentStatus status) {}
