package cl.furgonapp.drivers;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "driver_profile")
public class DriverProfile extends BaseEntity {

  @Column(nullable = false, unique = true)
  public UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public ProfileStatus status = ProfileStatus.INCOMPLETO;

  public UUID photoId;

  @Column(length = 2000)
  public String bio;

  public String rejectionReason;

  @ElementCollection
  @CollectionTable(name = "driver_territory_point", joinColumns = @JoinColumn(name = "driver_id"))
  @OrderColumn(name = "point_order")
  public java.util.List<cl.furgonapp.coverage.GeoPoint> territory = new java.util.ArrayList<>();
}
