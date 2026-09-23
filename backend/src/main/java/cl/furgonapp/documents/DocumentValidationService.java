package cl.furgonapp.documents;

import cl.furgonapp.drivers.DriverProfile;

public interface DocumentValidationService {
  void approve(DriverProfile driver);
}
