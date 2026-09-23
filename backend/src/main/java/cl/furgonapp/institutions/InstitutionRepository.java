package cl.furgonapp.institutions;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InstitutionRepository
  extends JpaRepository<Institution, UUID>
{
  java.util.Optional<Institution> findByOwnerId(UUID id);
}
