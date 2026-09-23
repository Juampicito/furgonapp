package cl.furgonapp.institutions;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "institution")
public class Institution extends BaseEntity {

  @Column(nullable = false, unique = true)
  public UUID ownerId;

  @Column(nullable = false)
  public String name;

  public String rbd;
  public String address;
  public String region;
  public String commune;
  public String phone;
  public String email;

  @Column(length = 2000)
  public String description;

  public UUID logoId;

  @Column(nullable = false)
  public String primaryColor = "#178A45";

  @Column(nullable = false)
  public String secondaryColor = "#FFFFFF";
}
