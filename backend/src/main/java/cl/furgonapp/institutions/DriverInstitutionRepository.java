package cl.furgonapp.institutions;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DriverInstitutionRepository
  extends JpaRepository<DriverInstitution, UUID>
{
  java.util.List<DriverInstitution> findByDriverId(UUID id);
  boolean existsByDriverIdAndInstitutionId(UUID driverId, UUID institutionId);
  void deleteByDriverId(UUID id);
}
