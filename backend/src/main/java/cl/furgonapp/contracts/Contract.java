package cl.furgonapp.contracts;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "transport_contract")
public class Contract extends BaseEntity {

  @Column(nullable = false, unique = true)
  public UUID quoteId;

  @Column(nullable = false)
  public UUID guardianId;

  @Column(nullable = false)
  public UUID driverId;

  @Column(nullable = false)
  public UUID vehicleId;

  @Column(nullable = false)
  public UUID institutionId;

  public UUID studentId;

  @Column(nullable = false, precision = 12, scale = 0)
  public java.math.BigDecimal monthlyPrice;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public ContractStatus status = ContractStatus.ACTIVO;
}
