package cl.furgonapp.notifications;

import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository
  extends JpaRepository<Notification, UUID>
{
  java.util.List<Notification> findByUserIdOrderByCreatedAtDesc(UUID id);
}
