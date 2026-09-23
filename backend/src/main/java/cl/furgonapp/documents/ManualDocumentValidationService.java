package cl.furgonapp.documents;

import cl.furgonapp.drivers.*;
import cl.furgonapp.shared.*;
import org.springframework.stereotype.Service;

@Service
public class ManualDocumentValidationService
  implements DocumentValidationService
{

  private final DriverService drivers;
  private final DriverDocumentRepository documents;

  public ManualDocumentValidationService(
    DriverService d,
    DriverDocumentRepository r
  ) {
    drivers = d;
    documents = r;
  }

  public void approve(DriverProfile d) {
    drivers.complete(d);
    if (
      documents
        .findByDriverId(d.id)
        .stream()
        .anyMatch(x -> x.status != DocumentStatus.APROBADO)
    ) throw ApiException.bad("Aprueba primero los cinco documentos.");
    d.status = ProfileStatus.APROBADO;
    d.rejectionReason = null;
  }
}
