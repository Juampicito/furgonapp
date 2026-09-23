package cl.furgonapp.documents;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DriverDocumentRepository
  extends JpaRepository<DriverDocument, UUID>
{
  @Query("select d.driverId from DriverDocument d where d.id=:id")
  java.util.Optional<UUID> findDriverIdById(@Param("id") UUID id);

  java.util.List<DriverDocument> findByDriverId(UUID id);
  java.util.Optional<DriverDocument> findByDriverIdAndType(
    UUID id,
    DocumentType type
  );
}
