package cl.furgonapp.vehicles;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
  java.util.Optional<Vehicle> findByDriverId(UUID driverId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select v from Vehicle v where v.driverId=:id")
  java.util.Optional<Vehicle> lockByDriverId(@Param("id") UUID id);
}
