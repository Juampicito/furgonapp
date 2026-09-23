package cl.furgonapp.guardians;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface GuardianInstitutionRepository
  extends JpaRepository<GuardianInstitution, UUID>
{
  java.util.List<GuardianInstitution> findByGuardianId(UUID id);
  boolean existsByGuardianIdAndInstitutionId(
    UUID guardianId,
    UUID institutionId
  );
  void deleteByGuardianIdAndInstitutionId(UUID guardianId, UUID institutionId);
}
