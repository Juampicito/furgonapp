package cl.furgonapp.coverage;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "coverage_area")
public class CoverageArea extends BaseEntity {

  @Column(nullable = false)
  public UUID driverId;

  @Column(nullable = false)
  public String region;

  @Column(nullable = false)
  public String commune;

  @Column(length = 10000)
  public String geometryGeoJson;

  public Double latitude;
  public Double longitude;
  public Double radiusMeters;
}
