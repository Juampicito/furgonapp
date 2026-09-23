package cl.furgonapp.shared;

import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.users.*;
import cl.furgonapp.vehicles.*;
import java.time.Instant;
import java.util.*;

public final class Views {

  public record UserView(
    UUID id,
    String email,
    Role role,
    String firstName,
    String lastName,
    String rut,
    String phone,
    String address,
    boolean active
  ) {}

  public static UserView user(User u) {
    return new UserView(
      u.id,
      u.email,
      u.role,
      u.firstName,
      u.lastName,
      u.rut,
      u.phone,
      u.address,
      u.active
    );
  }

  public record DocumentView(
    UUID id,
    UUID driverId,
    DocumentType type,
    DocumentStatus status,
    String filename,
    String reviewNote,
    Instant updatedAt
  ) {}

  public static DocumentView document(DriverDocument d) {
    return new DocumentView(
      d.id,
      d.driverId,
      d.type,
      d.status,
      d.filename,
      d.reviewNote,
      d.updatedAt
    );
  }

  public record VehicleView(
    UUID id,
    String plate,
    String brand,
    String model,
    int manufactureYear,
    String color,
    int capacity,
    UUID photoId,
    long occupied,
    long available
  ) {}

  public static VehicleView vehicle(Vehicle v, long used) {
    return new VehicleView(
      v.id,
      v.plate,
      v.brand,
      v.model,
      v.manufactureYear,
      v.color,
      v.capacity,
      v.photoId,
      used,
      v.capacity - used
    );
  }

  public record DriverView(
    UUID id,
    UUID userId,
    String name,
    String initials,
    ProfileStatus status,
    UUID photoId,
    String bio,
    VehicleView vehicle,
    List<String> communes,
    List<UUID> institutionIds,
    List<DocumentType> verifiedDocuments
  ) {}
}
