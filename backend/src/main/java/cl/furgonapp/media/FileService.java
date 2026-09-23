package cl.furgonapp.media;

import cl.furgonapp.auth.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.shared.*;
import java.io.IOException;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class FileService {

  private final Repositories r;
  private final CurrentUser actor;
  private final DriverService drivers;

  public FileService(Repositories r, CurrentUser a, DriverService d) {
    this.r = r;
    actor = a;
    drivers = d;
  }

  public byte[] bytes(MultipartFile file) {
    try {
      if (
        file.isEmpty() || file.getSize() > 5 * 1024 * 1024
      ) throw ApiException.bad("El archivo debe pesar entre 1 byte y 5 MB.");
      return file.getBytes();
    } catch (IOException e) {
      throw ApiException.bad("No se pudo leer el archivo.");
    }
  }

  public String type(byte[] data) {
    if (
      data.length > 4 &&
      data[0] == (byte) 0x89 &&
      data[1] == 0x50 &&
      data[2] == 0x4e &&
      data[3] == 0x47
    ) return "image/png";
    if (
      data.length > 3 &&
      data[0] == (byte) 0xff &&
      data[1] == (byte) 0xd8 &&
      data[2] == (byte) 0xff
    ) return "image/jpeg";
    if (
      data.length > 4 &&
      new String(data, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals(
        "%PDF-"
      )
    ) return "application/pdf";
    throw ApiException.bad(
      "Solo se permiten archivos PDF, PNG y JPEG válidos."
    );
  }

  public UUID image(MultipartFile file) {
    var u = actor.get();
    var data = bytes(file);
    String type = type(data);
    if (!type.startsWith("image/")) throw ApiException.bad(
      "La fotografía o logo debe ser PNG o JPEG."
    );
    try {
      var image = javax.imageio.ImageIO.read(
        new java.io.ByteArrayInputStream(data)
      );
      if (
        image == null || image.getWidth() > 6000 || image.getHeight() > 6000
      ) throw ApiException.bad(
        "Imagen inválida o demasiado grande (máximo 6000 píxeles)."
      );
    } catch (IOException e) {
      throw ApiException.bad("Imagen inválida.");
    }
    var m = new MediaAsset();
    m.ownerId = u.id;
    m.content = data;
    m.contentType = type;
    r.media().save(m);
    return m.id;
  }

  public Views.DocumentView upload(
    UUID driverId,
    DocumentType documentType,
    MultipartFile file
  ) {
    var driver = drivers.lockedOwned(driverId);
    var data = bytes(file);
    String type = type(data);
    if (
      (documentType == DocumentType.FOTO_CONDUCTOR ||
        documentType == DocumentType.FOTO_VEHICULO) &&
      !type.startsWith("image/")
    ) throw ApiException.bad(
      "Este documento debe ser una fotografía PNG o JPEG."
    );
    var d = r
      .documents()
      .findByDriverIdAndType(driverId, documentType)
      .orElseGet(DriverDocument::new);
    d.driverId = driverId;
    d.type = documentType;
    d.status = DocumentStatus.PENDIENTE;
    d.reviewNote = null;
    d.content = data;
    d.contentType = type;
    d.filename = Optional.ofNullable(file.getOriginalFilename())
      .orElse("documento")
      .replaceAll("[^a-zA-Z0-9._ -]", "_");
    if (d.filename.length() > 200) d.filename = d.filename.substring(
      d.filename.length() - 200
    );
    driver.status = ProfileStatus.INCOMPLETO;
    return Views.document(r.documents().save(d));
  }
}
