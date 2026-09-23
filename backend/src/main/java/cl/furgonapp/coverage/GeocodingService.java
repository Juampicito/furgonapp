package cl.furgonapp.coverage;

public interface GeocodingService {
  String commune(String address, String suppliedCommune);
}
