package cl.furgonapp.coverage;

import jakarta.persistence.*;

@Embeddable
public class GeoPoint {
  @Column(nullable = false) public double latitude;
  @Column(nullable = false) public double longitude;
  public GeoPoint() {}
  public GeoPoint(double latitude, double longitude) { this.latitude = latitude; this.longitude = longitude; }
}
