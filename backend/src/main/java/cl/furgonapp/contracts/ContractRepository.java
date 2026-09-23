package cl.furgonapp.contracts;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<Contract, UUID> {
  long countByVehicleIdAndStatus(UUID id, ContractStatus status);
  boolean existsByQuoteId(UUID id);
  java.util.List<Contract> findByGuardianId(UUID id);
  java.util.List<Contract> findByDriverId(UUID id);
}
