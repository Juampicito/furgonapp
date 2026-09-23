package cl.furgonapp.quotes;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "quote")
public class Quote extends BaseEntity {

  @Column(nullable = false)
  public UUID guardianId;

  @Column(nullable = false)
  public UUID driverId;

  @Column(nullable = false)
  public UUID institutionId;

  @Column(nullable = false)
  public String address;

  @Column(nullable = false)
  public String commune;

  @Column(nullable = false, precision = 12, scale = 0)
  public java.math.BigDecimal suggestedPrice;

  @Column(precision = 12, scale = 0)
  public java.math.BigDecimal offeredPrice;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public QuoteStatus status = QuoteStatus.SOLICITADA;
}
