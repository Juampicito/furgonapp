package cl.furgonapp.shared;

import cl.furgonapp.documents.DocumentStatus;
import cl.furgonapp.drivers.ProfileStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;

public final class Requests {

  public record UserUpdate(
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Size(max = 20) String rut,
    @NotBlank @Size(max = 30) String phone,
    @Email @NotBlank String email,
    @Size(max = 255) String address
  ) {}

  public record DriverUpdate(@Size(max = 2000) String bio, UUID photoId) {}

  public record VehicleUpdate(
    @NotBlank @Pattern(regexp = "[A-Za-z0-9-]{5,10}") String plate,
    @NotBlank String brand,
    @NotBlank String model,
    @Min(1980) @Max(2030) int manufactureYear,
    @NotBlank String color,
    @Min(1) @Max(60) int capacity,
    UUID photoId
  ) {}

  public record CoverageUpdate(
    @NotBlank String region,
    @NotEmpty @Size(max = 50) List<@NotBlank @Size(max = 100) String> communes,
    @NotEmpty Set<UUID> institutionIds
  ) {}

  public record InstitutionUpdate(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 30) String rbd,
    @NotBlank String address,
    @NotBlank String region,
    @NotBlank String commune,
    @NotBlank String phone,
    @Email @NotBlank String email,
    @Size(max = 2000) String description,
    UUID logoId,
    @Pattern(regexp = "#[0-9a-fA-F]{6}") @NotNull String primaryColor,
    @Pattern(regexp = "#[0-9a-fA-F]{6}") @NotNull String secondaryColor
  ) {}

  public record QuoteCreate(
    @NotNull UUID driverId,
    @NotNull UUID institutionId,
    @NotBlank @Size(max = 255) String address,
    @NotBlank @Size(max = 100) String commune
  ) {}

  public record Offer(
    @NotNull
    @DecimalMin("1")
    @Digits(integer = 9, fraction = 0)
    BigDecimal monthlyPrice
  ) {}

  public record Review(
    @NotNull DocumentStatus status,
    @Size(max = 255) String note
  ) {}

  public record ProfileReview(
    @NotNull ProfileStatus status,
    @Size(max = 255) String reason
  ) {}

  public record Active(@NotNull Boolean active) {}
}
