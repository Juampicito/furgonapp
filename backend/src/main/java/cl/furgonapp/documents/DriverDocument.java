package cl.furgonapp.documents;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "driver_document")
public class DriverDocument extends BaseEntity {

  @Column(nullable = false)
  public UUID driverId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public DocumentType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public DocumentStatus status = DocumentStatus.PENDIENTE;

  @Column(nullable = false)
  public String filename;

  @Column(nullable = false)
  public String contentType;

  @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARBINARY)
  @Column(nullable = false, columnDefinition = "bytea")
  public byte[] content;

  public String reviewNote;
}
