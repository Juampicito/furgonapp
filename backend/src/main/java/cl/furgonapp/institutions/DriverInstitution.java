package cl.furgonapp.institutions;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "driver_institution")
public class DriverInstitution extends BaseEntity {

  @Column(nullable = false)
  public UUID driverId;

  @Column(nullable = false)
  public UUID institutionId;
}
