package cl.furgonapp.shared;

import cl.furgonapp.coverage.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
import cl.furgonapp.guardians.GuardianInstitution;
import cl.furgonapp.institutions.*;
import cl.furgonapp.media.*;
import cl.furgonapp.notifications.*;
import cl.furgonapp.quotes.*;
import cl.furgonapp.users.*;
import cl.furgonapp.vehicles.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@org.springframework.context.annotation.Profile("local")
@ConditionalOnProperty(name = "app.presentation.enabled", havingValue = "true")
public class PresentationData implements CommandLineRunner {

  private final Repositories r;
  private final PasswordEncoder passwords;

  public PresentationData(Repositories r, PasswordEncoder p) {
    this.r = r;
    passwords = p;
  }

  @Override
  @Transactional
  public void run(String... args) {
    var handles = List.of(
      "administrador",
      "apoderadoprofe",
      "furgonistaprofe",
      "colegioprueba"
    );
    long existing = handles
      .stream()
      .filter(h ->
        r
          .users()
          .findByEmailIgnoreCase(h + "@presentacion.local")
          .isPresent()
      )
      .count();
    // Never overwrite passwords, approvals or presentation progress on restart.
    if (existing == handles.size()) return;
    if (existing != 0) throw new IllegalStateException(
      "Existen cuentas de presentación incompletas. No se modificó ninguna cuenta."
    );
    user("administrador", "Administrador", "Presentación", Role.ADMIN);
    var guardian = user(
      "apoderadoprofe",
      "Familia",
      "Presentación",
      Role.APODERADO
    );
    guardian.address = "Avenida Macul, Macul";
    var owner = user("colegioprueba", "Colegio", "Los Aromos", Role.COLEGIO);
    var institution = school(
      owner,
      "Colegio Los Aromos · Presentación",
      "Macul",
      "#178A45",
      "LA"
    );
    driver(
      "furgonistaprofe",
      "Carlos",
      "Presentación",
      "Hyundai",
      "H1",
      16,
      "PRBA-10",
      ProfileStatus.APROBADO,
      List.of("Macul", "Ñuñoa", "La Florida", "Peñalolén"),
      List.of(institution)
    );
    var saved = new GuardianInstitution();
    saved.guardianId = guardian.id;
    saved.institutionId = institution.id;
    r.savedInstitutions().save(saved);
  }

  private User user(String email, String first, String last, Role role) {
    var u = new User();
    u.email = email + "@presentacion.local";
    u.firstName = first;
    u.lastName = last;
    u.role = role;
    u.rut = "12.345.678-5";
    u.phone = "+56 9 1234 5678";
    u.address = "Avenida Macul, Macul · Datos de presentación";
    u.passwordHash = passwords.encode(email);
    return r.users().save(u);
  }

  private UUID svg(UUID owner, String body, String background) {
    var m = new MediaAsset();
    m.ownerId = owner;
    m.contentType = "image/svg+xml";
    m.content = (
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' rx='24' fill='" +
      background +
      "'/>" +
      body +
      "</svg>"
    ).getBytes(StandardCharsets.UTF_8);
    return r.media().save(m).id;
  }

  private Institution school(
    User owner,
    String name,
    String commune,
    String color,
    String letters
  ) {
    var i = new Institution();
    i.ownerId = owner.id;
    i.name = name;
    i.commune = commune;
    i.address = "Avenida Macul, Macul · Institución ficticia";
    i.region = "Región Metropolitana";
    i.rbd = "12345";
    i.email = owner.email;
    i.phone = owner.phone;
    i.description =
      "Una comunidad que acompaña a cada familia, dentro y fuera del colegio.";
    i.primaryColor = color;
    i.logoId = svg(
      owner.id,
      "<path d='M200 48l78 30v75c0 50-78 90-78 90s-78-40-78-90V78z' fill='white'/><text x='200' y='155' text-anchor='middle' font-family='Arial' font-size='45' font-weight='bold' fill='" +
        color +
        "'>" +
        letters +
        "</text>",
      color
    );
    return r.institutions().save(i);
  }

  private DriverProfile driver(
    String email,
    String first,
    String last,
    String brand,
    String model,
    int capacity,
    String plate,
    ProfileStatus status,
    List<String> communes,
    List<Institution> institutions
  ) {
    var u = user(email, first, last, Role.FURGONISTA);
    var d = new DriverProfile();
    d.userId = u.id;
    d.status = status;
    d.bio =
      "Transporte escolar cercano y responsable. Coordinación directa con las familias, servicio de ida y regreso y atención personalizada.";
    d.photoId = svg(
      u.id,
      "<circle cx='200' cy='118' r='56' fill='#D9A783'/><path d='M144 109c0-82 113-82 113 0l-27-27-58 9z' fill='#344239'/><path d='M95 300v-52c0-100 210-100 210 0v52z' fill='#285C4A'/><circle cx='181' cy='118' r='4' fill='#344239'/><circle cx='218' cy='118' r='4' fill='#344239'/><path d='M183 144q17 13 34 0' fill='none' stroke='#8A4C34' stroke-width='4'/>",
      "#E9EDE4"
    );
    r.drivers().save(d);
    var v = new Vehicle();
    v.driverId = d.id;
    v.plate = plate;
    v.brand = brand;
    v.model = model;
    v.color = "Blanco";
    v.manufactureYear = 2022;
    v.capacity = capacity;
    v.photoId = svg(
      u.id,
      "<ellipse cx='203' cy='240' rx='160' ry='13' fill='#D5DDD3'/><path d='M42 198V95q0-20 24-20h217l65 82v41z' fill='#FFF' stroke='#82988B' stroke-width='3'/><path d='M68 92h65v62H68zm78 0h65v62h-65zm78 0h47l45 62h-92z' fill='#A7C9C2'/><path d='M42 165h304v24H42z' fill='#F5BA42'/><circle cx='103' cy='208' r='28' fill='#2B3D35'/><circle cx='103' cy='208' r='12' fill='#CBD5CC'/><circle cx='287' cy='208' r='28' fill='#2B3D35'/><circle cx='287' cy='208' r='12' fill='#CBD5CC'/><text x='177' y='184' text-anchor='middle' font-family='Arial' font-size='15' font-weight='bold' fill='#3B3E2B'>ESCOLAR</text>",
      "#EEF2E9"
    );
    r.vehicles().save(v);
    for (var commune : communes) {
      var c = new CoverageArea();
      c.driverId = d.id;
      c.commune = commune;
      c.region = "Región Metropolitana";
      r.coverage().save(c);
    }
    for (var i : institutions) {
      var x = new DriverInstitution();
      x.driverId = d.id;
      x.institutionId = i.id;
      r.driverInstitutions().save(x);
    }
    for (var t : DocumentType.values()) {
      var doc = new DriverDocument();
      doc.driverId = d.id;
      doc.type = t;
      doc.status =
        status == ProfileStatus.APROBADO
          ? DocumentStatus.APROBADO
          : DocumentStatus.PENDIENTE;
      doc.filename = t.name().toLowerCase() + "-presentacion.txt";
      doc.contentType = "text/plain";
      doc.content = (
        "DOCUMENTO DE PRESENTACION FURGONAPP — " +
        t +
        " — Sin validez oficial"
      ).getBytes(StandardCharsets.UTF_8);
      r.documents().save(doc);
    }
    return d;
  }
}
