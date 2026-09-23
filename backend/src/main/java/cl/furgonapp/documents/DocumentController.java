package cl.furgonapp.documents;

import cl.furgonapp.administration.*;
import cl.furgonapp.auth.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.institutions.*;
import cl.furgonapp.media.*;
import cl.furgonapp.quotes.*;
import cl.furgonapp.shared.*;
import cl.furgonapp.users.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class DocumentController {

  private final Repositories r;
  private final DriverService drivers;
  private final FileService files;

  public DocumentController(
    Repositories r,
    DriverService drivers,
    FileService files
  ) {
    this.r = r;
    this.drivers = drivers;
    this.files = files;
  }

  @PostMapping("/drivers/{id}/documents")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public Views.DocumentView upload(
    @PathVariable UUID id,
    @RequestParam DocumentType type,
    @RequestParam MultipartFile file
  ) {
    return files.upload(id, type, file);
  }

  @GetMapping("/documents/{id}/content")
  @PreAuthorize("hasAnyRole('FURGONISTA','ADMIN')")
  public ResponseEntity<byte[]> content(@PathVariable UUID id) {
    var d = r.documents().findById(id).orElseThrow(ApiException::missing);
    drivers.owned(d.driverId);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(d.contentType))
      .header(
        "Content-Disposition",
        ContentDisposition.attachment().filename(d.filename).build().toString()
      )
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .body(d.content);
  }
}
