package cl.furgonapp.shared;

import cl.furgonapp.contracts.*;
import cl.furgonapp.coverage.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.guardians.*;
import cl.furgonapp.institutions.*;
import cl.furgonapp.media.*;
import cl.furgonapp.notifications.*;
import cl.furgonapp.quotes.*;
import cl.furgonapp.users.*;
import cl.furgonapp.vehicles.*;
import org.springframework.stereotype.Component;

@Component
public record Repositories(
  UserRepository users,
  DriverProfileRepository drivers,
  VehicleRepository vehicles,
  CoverageAreaRepository coverage,
  InstitutionRepository institutions,
  DriverInstitutionRepository driverInstitutions,
  GuardianInstitutionRepository savedInstitutions,
  DriverDocumentRepository documents,
  QuoteRepository quotes,
  ContractRepository contracts,
  NotificationRepository notifications,
  MediaAssetRepository media
) {}
