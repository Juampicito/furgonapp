package cl.furgonapp.drivers;

import cl.furgonapp.auth.*;
import cl.furgonapp.contracts.*;
import cl.furgonapp.coverage.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.institutions.*;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import cl.furgonapp.vehicles.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DriverService {

  private final Repositories r;
  private final CurrentUser actor;

  public DriverService(Repositories r, CurrentUser a) {
    this.r = r;
    actor = a;
  }

  public DriverProfile owned(UUID id) {
    var d = r.drivers().findById(id).orElseThrow(ApiException::missing);
    actor.owner(d.userId);
    return d;
  }

  public DriverProfile lockedOwned(UUID id) {
    var d = r.drivers().lockById(id).orElseThrow(ApiException::missing);
    actor.owner(d.userId);
    return d;
  }

  public void update(UUID id, Requests.DriverUpdate b) {
    var d = lockedOwned(id);
    asset(b.photoId(), d.userId);
    d.bio = b.bio();
    if (!Objects.equals(d.photoId, b.photoId())) {
      d.photoId = b.photoId();
      d.status = ProfileStatus.INCOMPLETO;
    }
  }

  public void asset(UUID id, UUID owner) {
    if (
      id != null &&
      !r
        .media()
        .findById(id)
        .orElseThrow(ApiException::missing)
        .ownerId.equals(owner)
    ) throw ApiException.forbidden();
  }

  public void vehicle(UUID id, Requests.VehicleUpdate b) {
    var d = lockedOwned(id);
    var v = r.vehicles().lockByDriverId(id).orElseGet(Vehicle::new);
    long used = r
      .contracts()
      .countByVehicleIdAndStatus(v.id, ContractStatus.ACTIVO);
    if (b.capacity() < used) throw ApiException.conflict(
      "La capacidad no puede ser menor que los contratos activos."
    );
    asset(b.photoId(), d.userId);
    boolean changed =
      v.driverId == null ||
      !Objects.equals(v.plate, b.plate().toUpperCase()) ||
      !Objects.equals(v.photoId, b.photoId()) ||
      !Objects.equals(v.brand, b.brand()) ||
      !Objects.equals(v.model, b.model()) ||
      !Objects.equals(v.color, b.color()) ||
      v.manufactureYear != b.manufactureYear() ||
      v.capacity != b.capacity();
    v.driverId = id;
    v.plate = b.plate().toUpperCase();
    v.brand = b.brand();
    v.model = b.model();
    v.manufactureYear = b.manufactureYear();
    v.color = b.color();
    v.capacity = b.capacity();
    v.photoId = b.photoId();
    r.vehicles().save(v);
    if (changed) d.status = ProfileStatus.INCOMPLETO;
  }

  public void coverage(UUID id, Requests.CoverageUpdate b) {
    lockedOwned(id);
    for (var institutionId : b.institutionIds())
      if (
        !r.institutions().existsById(institutionId)
      ) throw ApiException.missing();
    r.coverage().deleteByDriverId(id);
    r.coverage().flush();
    for (String commune : new LinkedHashSet<>(b.communes())) {
      var a = new CoverageArea();
      a.driverId = id;
      a.region = b.region();
      a.commune = commune.trim();
      r.coverage().save(a);
    }
    r.driverInstitutions().deleteByDriverId(id);
    r.driverInstitutions().flush();
    for (var institutionId : b.institutionIds()) {
      var x = new DriverInstitution();
      x.driverId = id;
      x.institutionId = institutionId;
      r.driverInstitutions().save(x);
    }
  }

  public void submit(UUID id) {
    var d = lockedOwned(id);
    complete(d);
    d.status = ProfileStatus.PENDIENTE_VERIFICACION;
  }

  public void complete(DriverProfile d) {
    var u = r.users().findById(d.userId).orElseThrow(ApiException::missing);
    var v = r
      .vehicles()
      .findByDriverId(d.id)
      .orElseThrow(() -> ApiException.bad("Registra tu vehículo."));
    if (
      u.rut == null ||
      u.rut.isBlank() ||
      u.phone == null ||
      u.phone.isBlank() ||
      d.photoId == null ||
      v.photoId == null ||
      r.coverage().findByDriverId(d.id).isEmpty() ||
      r.driverInstitutions().findByDriverId(d.id).isEmpty() ||
      r.documents().findByDriverId(d.id).size() < DocumentType.values().length
    ) throw ApiException.bad(
      "Completa datos personales, fotografías, cobertura, instituciones y los cinco documentos."
    );
  }

  public Views.DriverView view(DriverProfile d) {
    var u = r.users().findById(d.userId).orElseThrow(ApiException::missing);
    var v = r
      .vehicles()
      .findByDriverId(d.id)
      .map(x ->
        Views.vehicle(
          x,
          r.contracts().countByVehicleIdAndStatus(x.id, ContractStatus.ACTIVO)
        )
      )
      .orElse(null);
    return new Views.DriverView(
      d.id,
      d.userId,
      u.firstName + " " + u.lastName,
      "" + u.firstName.charAt(0) + u.lastName.charAt(0),
      d.status,
      d.photoId,
      d.bio,
      v,
      r
        .coverage()
        .findByDriverId(d.id)
        .stream()
        .map(x -> x.commune)
        .toList(),
      r
        .driverInstitutions()
        .findByDriverId(d.id)
        .stream()
        .map(x -> x.institutionId)
        .toList(),
      r
        .documents()
        .findByDriverId(d.id)
        .stream()
        .filter(x -> x.status == DocumentStatus.APROBADO)
        .map(x -> x.type)
        .toList()
    );
  }

  public boolean matches(DriverProfile d, UUID institutionId, String commune) {
    if (
      d.status != ProfileStatus.APROBADO ||
      !r.users().findById(d.userId).orElseThrow().active
    ) return false;
    var v = r.vehicles().findByDriverId(d.id);
    return (
      v.isPresent() &&
      r
        .contracts()
        .countByVehicleIdAndStatus(v.get().id, ContractStatus.ACTIVO) <
        v.get().capacity &&
      r
        .driverInstitutions()
        .existsByDriverIdAndInstitutionId(d.id, institutionId) &&
      r
        .coverage()
        .findByDriverId(d.id)
        .stream()
        .anyMatch(a -> a.commune.equalsIgnoreCase(commune.trim()))
    );
  }

  public List<Views.DriverView> search(UUID institutionId, String commune) {
    actor.get();
    if (
      !r.institutions().existsById(institutionId)
    ) throw ApiException.missing();
    return r
      .drivers()
      .findAll()
      .stream()
      .filter(d -> matches(d, institutionId, commune))
      .map(this::view)
      .toList();
  }
}
