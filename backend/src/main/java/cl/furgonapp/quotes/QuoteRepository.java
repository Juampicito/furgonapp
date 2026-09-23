package cl.furgonapp.quotes;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface QuoteRepository extends JpaRepository<Quote, UUID> {
  java.util.List<Quote> findByGuardianId(UUID id);
  java.util.List<Quote> findByDriverId(UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select q from Quote q where q.id=:id")
  java.util.Optional<Quote> lockById(@Param("id") UUID id);
}
