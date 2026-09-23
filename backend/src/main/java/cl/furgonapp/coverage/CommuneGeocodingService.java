package cl.furgonapp.coverage;

import cl.furgonapp.shared.ApiException;
import org.springframework.stereotype.Service;

@Service
public class CommuneGeocodingService implements GeocodingService {

  public String commune(String address, String suppliedCommune) {
    if (
      address == null ||
      address.isBlank() ||
      suppliedCommune == null ||
      suppliedCommune.isBlank()
    ) throw ApiException.bad("Indica dirección y comuna.");
    return suppliedCommune.trim();
  }
}
