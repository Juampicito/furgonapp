package cl.furgonapp.coverage;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface CoverageAreaRepository
  extends JpaRepository<CoverageArea, UUID>
{
  java.util.List<CoverageArea> findByDriverId(UUID id);
  void deleteByDriverId(UUID id);
}
