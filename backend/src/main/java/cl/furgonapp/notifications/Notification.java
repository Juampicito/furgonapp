package cl.furgonapp.notifications;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "notification")
public class Notification extends BaseEntity {

  @Column(nullable = false)
  public UUID userId;

  @Column(nullable = false)
  public String title;

  @Column(nullable = false, length = 2000)
  public String message;

  public UUID quoteId;

  @Column(nullable = false)
  public boolean read = false;
}
