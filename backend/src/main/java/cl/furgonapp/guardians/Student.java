package cl.furgonapp.guardians;

import java.util.UUID;

public record Student(
  UUID id,
  UUID guardianId,
  String firstName,
  String lastName
) {}
