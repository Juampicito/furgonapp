package cl.furgonapp.quotes;

import cl.furgonapp.auth.*;
import cl.furgonapp.contracts.*;
import cl.furgonapp.coverage.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.notifications.*;
import cl.furgonapp.pricing.*;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class QuoteService {

  private final Repositories r;
  private final CurrentUser actor;
  private final DriverService drivers;
  private final PricingService pricing;
  private final GeocodingService geo;
  private final NotificationService notifications;
  public final BigDecimal maxDeviation;

  public QuoteService(
    Repositories r,
    CurrentUser a,
    DriverService d,
    PricingService p,
    GeocodingService g,
    NotificationService n,
    @Value("${app.max-price-deviation-percentage}") BigDecimal max
  ) {
    this.r = r;
    actor = a;
    drivers = d;
    pricing = p;
    geo = g;
    notifications = n;
    maxDeviation = max;
    if (max.signum() < 0) throw new IllegalArgumentException(
      "El margen debe ser positivo."
    );
  }

  public Quote create(Requests.QuoteCreate b) {
    actor.role(Role.APODERADO);
    var u = actor.get();
    if (
      !r
        .savedInstitutions()
        .existsByGuardianIdAndInstitutionId(u.id, b.institutionId())
    ) throw ApiException.bad(
      "Guarda la institución antes de solicitar una cotización."
    );
    var d = r
      .drivers()
      .lockById(b.driverId())
      .orElseThrow(ApiException::missing);
    var commune = geo.commune(b.address(), b.commune());
    if (
      !drivers.matches(d, b.institutionId(), commune)
    ) throw ApiException.conflict(
      "El furgonista ya no está disponible para esta zona e institución."
    );
    var q = new Quote();
    q.guardianId = u.id;
    q.driverId = d.id;
    q.institutionId = b.institutionId();
    q.address = b.address();
    q.commune = commune;
    q.suggestedPrice = pricing.estimate(commune, b.institutionId());
    r.quotes().save(q);
    notifications.send(
      d.userId,
      "Nueva solicitud de cotización",
      u.firstName + " solicita transporte desde " + commune,
      q.id
    );
    return q;
  }

  private Quote lock(UUID id) {
    return r.quotes().lockById(id).orElseThrow(ApiException::missing);
  }

  public void review(UUID id) {
    var q = lock(id);
    driverOwner(q);
    if (q.status != QuoteStatus.SOLICITADA) throw ApiException.conflict(
      "La solicitud ya fue revisada."
    );
    q.status = QuoteStatus.EN_REVISION;
  }

  private void driverOwner(Quote q) {
    actor.role(Role.FURGONISTA);
    actor.owner(r.drivers().findById(q.driverId).orElseThrow().userId);
  }

  public void offer(UUID id, Requests.Offer b) {
    var q = lock(id);
    driverOwner(q);
    if (
      q.status != QuoteStatus.SOLICITADA && q.status != QuoteStatus.EN_REVISION
    ) throw ApiException.conflict("La cotización no admite nuevas ofertas.");
    var max = q.suggestedPrice.multiply(
      BigDecimal.ONE.add(maxDeviation.movePointLeft(2))
    );
    if (b.monthlyPrice().compareTo(max) > 0) throw ApiException.bad(
      "La oferta excede el rango permitido por FurgonApp."
    );
    q.offeredPrice = b.monthlyPrice();
    q.status = QuoteStatus.OFERTA_ENVIADA;
    notifications.send(
      q.guardianId,
      "Tu oferta está lista",
      "Recibiste una oferta por $" + q.offeredPrice + " mensuales.",
      q.id
    );
  }

  public Contract accept(UUID id) {
    var q = lock(id);
    actor.role(Role.APODERADO);
    actor.owner(q.guardianId);
    if (q.status != QuoteStatus.OFERTA_ENVIADA) throw ApiException.conflict(
      "Esta oferta ya fue resuelta o aún no fue enviada."
    );
    var d = r.drivers().lockById(q.driverId).orElseThrow(ApiException::missing);
    var v = r
      .vehicles()
      .lockByDriverId(q.driverId)
      .orElseThrow(ApiException::missing);
    if (
      !drivers.matches(d, q.institutionId, q.commune)
    ) throw ApiException.conflict(
      "El furgonista ya no cumple las condiciones o no tiene cupos disponibles."
    );
    if (
      r.contracts().countByVehicleIdAndStatus(v.id, ContractStatus.ACTIVO) >=
      v.capacity
    ) throw ApiException.conflict("No quedan cupos disponibles.");
    var c = new Contract();
    c.quoteId = q.id;
    c.guardianId = q.guardianId;
    c.driverId = q.driverId;
    c.institutionId = q.institutionId;
    c.vehicleId = v.id;
    c.monthlyPrice = q.offeredPrice;
    r.contracts().saveAndFlush(c);
    q.status = QuoteStatus.ACEPTADA;
    notifications.send(
      d.userId,
      "Oferta aceptada · nuevo contrato",
      "Se reservó un cupo en tu vehículo.",
      q.id
    );
    notifications.send(
      q.guardianId,
      "Contrato activo",
      "Tu cupo está reservado. Pago pendiente de implementación.",
      q.id
    );
    return c;
  }

  public void reject(UUID id) {
    var q = lock(id);
    var u = actor.get();
    var d = r.drivers().findById(q.driverId).orElseThrow();
    if (
      u.role != Role.ADMIN &&
      !u.id.equals(q.guardianId) &&
      !u.id.equals(d.userId)
    ) throw ApiException.forbidden();
    if (
      q.status == QuoteStatus.ACEPTADA ||
      q.status == QuoteStatus.RECHAZADA ||
      q.status == QuoteStatus.CANCELADA
    ) throw ApiException.conflict("La cotización ya fue resuelta.");
    if (
      u.id.equals(q.guardianId) && q.status != QuoteStatus.OFERTA_ENVIADA
    ) q.status = QuoteStatus.CANCELADA;
    else q.status = QuoteStatus.RECHAZADA;
    notifications.send(
      u.id.equals(q.guardianId) ? d.userId : q.guardianId,
      "Cotización cerrada",
      "La solicitud fue rechazada o cancelada.",
      q.id
    );
  }
}
