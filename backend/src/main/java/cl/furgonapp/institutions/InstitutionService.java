package cl.furgonapp.institutions;

import cl.furgonapp.auth.*;
import cl.furgonapp.drivers.DriverService;
import cl.furgonapp.guardians.GuardianInstitution;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InstitutionService {

  private final Repositories r;
  private final CurrentUser actor;
  private final DriverService drivers;

  public InstitutionService(Repositories r, CurrentUser a, DriverService d) {
    this.r = r;
    actor = a;
    drivers = d;
  }

  public Institution save(UUID id, Requests.InstitutionUpdate b) {
    actor.role(Role.COLEGIO);
    var i =
      id == null
        ? new Institution()
        : r.institutions().findById(id).orElseThrow(ApiException::missing);
    if (id == null) i.ownerId = actor.get().id;
    actor.owner(i.ownerId);
    drivers.asset(b.logoId(), i.ownerId);
    i.name = b.name();
    i.rbd = b.rbd();
    i.address = b.address();
    i.region = b.region();
    i.commune = b.commune();
    i.phone = b.phone();
    i.email = b.email();
    i.description = b.description();
    i.logoId = b.logoId();
    i.primaryColor = b.primaryColor();
    i.secondaryColor = b.secondaryColor();
    return r.institutions().save(i);
  }

  public void saveForGuardian(UUID id) {
    actor.role(Role.APODERADO);
    var u = actor.get();
    if (!r.institutions().existsById(id)) throw ApiException.missing();
    if (!r.savedInstitutions().existsByGuardianIdAndInstitutionId(u.id, id)) {
      var link = new GuardianInstitution();
      link.guardianId = u.id;
      link.institutionId = id;
      r.savedInstitutions().save(link);
    }
  }

  public void removeForGuardian(UUID id) {
    actor.role(Role.APODERADO);
    r.savedInstitutions().deleteByGuardianIdAndInstitutionId(
      actor.get().id,
      id
    );
  }
}
