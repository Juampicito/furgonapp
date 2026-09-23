package cl.furgonapp.users;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class User extends BaseEntity {

  @Column(nullable = false, unique = true)
  public String email;

  @Column(nullable = false)
  public String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Role role;

  @Column(nullable = false)
  public String firstName;

  @Column(nullable = false)
  public String lastName;

  public String rut;
  public String phone;
  public String address;

  @Column(nullable = false)
  public boolean active = true;
}
