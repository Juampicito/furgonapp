package cl.furgonapp.media;

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
public class MediaController {

  private final Repositories r;
  private final FileService files;

  public MediaController(Repositories r, FileService files) {
    this.r = r;
    this.files = files;
  }

  @PostMapping("/media")
  public Map<String, UUID> image(@RequestParam MultipartFile file) {
    return Map.of("id", files.image(file));
  }

  @GetMapping("/media/{id}")
  public ResponseEntity<byte[]> image(@PathVariable UUID id) {
    var m = r.media().findById(id).orElseThrow(ApiException::missing);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(m.contentType))
      .header("X-Content-Type-Options", "nosniff")
      .header("Content-Security-Policy", "default-src 'none'; sandbox")
      .body(m.content);
  }
}
