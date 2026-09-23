package cl.furgonapp.vehicles;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "vehicle")
public class Vehicle extends BaseEntity {

  @Column(nullable = false, unique = true)
  public UUID driverId;

  @Column(nullable = false, unique = true)
  public String plate;

  @Column(nullable = false)
  public String brand;

  @Column(nullable = false)
  public String model;

  @Column(nullable = false)
  public int manufactureYear;

  @Column(nullable = false)
  public String color;

  @Column(nullable = false)
  public int capacity;

  public UUID photoId;
}
