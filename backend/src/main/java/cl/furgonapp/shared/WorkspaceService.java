package cl.furgonapp.shared;

import cl.furgonapp.auth.*;
import cl.furgonapp.contracts.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.institutions.*;
import cl.furgonapp.notifications.*;
import cl.furgonapp.quotes.*;
import cl.furgonapp.users.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class WorkspaceService {

  private final Repositories r;
  private final CurrentUser actor;
  private final DriverService drivers;
  private final QuoteService quotes;

  public WorkspaceService(
    Repositories r,
    CurrentUser a,
    DriverService d,
    QuoteService q
  ) {
    this.r = r;
    actor = a;
    drivers = d;
    quotes = q;
  }

  public record QuoteView(
    UUID id,
    UUID guardianId,
    UUID driverId,
    UUID institutionId,
    String address,
    String commune,
    BigDecimal suggestedPrice,
    BigDecimal offeredPrice,
    QuoteStatus status,
    Instant createdAt,
    String guardianName,
    String guardianPhone,
    String guardianEmail,
    String driverName,
    String institutionName
  ) {}

  public record ContractView(
    UUID id,
    UUID quoteId,
    UUID driverId,
    UUID institutionId,
    BigDecimal monthlyPrice,
    ContractStatus status,
    Instant createdAt,
    String guardianName,
    String driverName,
    String institutionName,
    String paymentStatus
  ) {}

  public QuoteView quote(Quote q) {
    var g = r.users().findById(q.guardianId).orElseThrow();
    var d = r.drivers().findById(q.driverId).orElseThrow();
    var u = r.users().findById(d.userId).orElseThrow();
    return new QuoteView(
      q.id,
      q.guardianId,
      q.driverId,
      q.institutionId,
      q.address,
      q.commune,
      q.suggestedPrice,
      q.offeredPrice,
      q.status,
      q.createdAt,
      g.firstName + " " + g.lastName,
      g.phone,
      g.email,
      u.firstName + " " + u.lastName,
      r.institutions().findById(q.institutionId).orElseThrow().name
    );
  }

  public ContractView contract(Contract c) {
    var q = quote(r.quotes().findById(c.quoteId).orElseThrow());
    return new ContractView(
      c.id,
      c.quoteId,
      c.driverId,
      c.institutionId,
      c.monthlyPrice,
      c.status,
      c.createdAt,
      q.guardianName(),
      q.driverName(),
      q.institutionName(),
      "PENDIENTE_IMPLEMENTACION"
    );
  }

  public Map<String, Object> get() {
    var u = actor.get();
    var data = new LinkedHashMap<String, Object>();
    data.put("user", Views.user(u));
    data.put("institutions", r.institutions().findAll());
    data.put("maxPriceDeviationPercentage", quotes.maxDeviation);
    data.put(
      "notifications",
      r.notifications().findByUserIdOrderByCreatedAtDesc(u.id)
    );
    List<Quote> qs = List.of();
    List<Contract> cs = List.of();
    List<DriverProfile> ds = List.of();
    switch (u.role) {
      case ADMIN -> {
        data.put(
          "users",
          r.users().findAll().stream().map(Views::user).toList()
        );
        data.put(
          "documents",
          r.documents().findAll().stream().map(Views::document).toList()
        );
        data.put("notifications", r.notifications().findAll());
        qs = r.quotes().findAll();
        cs = r.contracts().findAll();
        ds = r.drivers().findAll();
      }
      case FURGONISTA -> {
        var d = r
          .drivers()
          .findByUserId(u.id)
          .orElseThrow(ApiException::missing);
        ds = List.of(d);
        qs = r.quotes().findByDriverId(d.id);
        cs = r.contracts().findByDriverId(d.id);
        data.put(
          "documents",
          r
            .documents()
            .findByDriverId(d.id)
            .stream()
            .map(Views::document)
            .toList()
        );
      }
      case APODERADO -> {
        data.put(
          "savedInstitutionIds",
          r
            .savedInstitutions()
            .findByGuardianId(u.id)
            .stream()
            .map(x -> x.institutionId)
            .toList()
        );
        qs = r.quotes().findByGuardianId(u.id);
        cs = r.contracts().findByGuardianId(u.id);
      }
      case COLEGIO -> {
        var institution = r.institutions().findByOwnerId(u.id);
        ds = institution
          .map(i ->
            r
              .drivers()
              .findAll()
              .stream()
              .filter(d ->
                r
                  .driverInstitutions()
                  .existsByDriverIdAndInstitutionId(d.id, i.id)
              )
              .toList()
          )
          .orElse(List.of());
      }
    }
    data.put("drivers", ds.stream().map(drivers::view).toList());
    data.put(
      "quotes",
      qs
        .stream()
        .sorted(Comparator.comparing((Quote q) -> q.createdAt).reversed())
        .map(this::quote)
        .toList()
    );
    data.put("contracts", cs.stream().map(this::contract).toList());
    return data;
  }
}
