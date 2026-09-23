package cl.furgonapp.media;

import cl.furgonapp.shared.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "media_asset")
public class MediaAsset extends BaseEntity {

  @Column(nullable = false)
  public UUID ownerId;

  @Column(nullable = false)
  public String contentType;

  @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARBINARY)
  @Column(nullable = false, columnDefinition = "bytea")
  public byte[] content;
}
