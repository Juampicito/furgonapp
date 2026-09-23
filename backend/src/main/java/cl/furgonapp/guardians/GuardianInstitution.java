package cl.furgonapp.guardians;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "guardian_institution")
public class GuardianInstitution extends BaseEntity {

  @Column(nullable = false)
  public UUID guardianId;

  @Column(nullable = false)
  public UUID institutionId;
}
