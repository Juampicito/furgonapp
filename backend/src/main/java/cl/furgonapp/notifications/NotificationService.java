package cl.furgonapp.notifications;

import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  private final NotificationRepository repo;

  public NotificationService(NotificationRepository r) {
    repo = r;
  }

  public void send(UUID userId, String title, String message, UUID quoteId) {
    var n = new Notification();
    n.userId = userId;
    n.title = title;
    n.message = message;
    n.quoteId = quoteId;
    repo.save(n);
  }
}
