package cl.furgonapp.drivers;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DriverProfileRepository
  extends JpaRepository<DriverProfile, UUID>
{
  java.util.Optional<DriverProfile> findByUserId(UUID userId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select d from DriverProfile d where d.id=:id")
  java.util.Optional<DriverProfile> lockById(@Param("id") UUID id);
}
