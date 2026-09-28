package cl.furgonapp.shared;

import cl.furgonapp.contracts.*;
import cl.furgonapp.coverage.*;
import cl.furgonapp.documents.*;
import cl.furgonapp.drivers.*;
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
@org.springframework.context.annotation.Profile("test")
public class DemoData implements CommandLineRunner {

  private final Repositories r;
  private final PasswordEncoder passwords;

  public DemoData(Repositories r, PasswordEncoder p) {
    this.r = r;
    passwords = p;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (r.users().count() > 0) return;
    var admin = user("admin", "Equipo", "FurgonApp", Role.ADMIN);
    var guardian = user("maria", "María", "González", Role.APODERADO);
    guardian.address = "Los Plátanos 1234, Macul";
    var otherGuardian = user("familia", "Familia", "Demo", Role.APODERADO);
    var school = user("sanmarcos", "Colegio", "San Marcos", Role.COLEGIO);
    var school2 = user("santamaria", "Colegio", "Santa María", Role.COLEGIO);
    var san = school(school, "Colegio San Marcos", "Macul", "#178A45", "SM");
    var santa = school(
      school2,
      "Colegio Santa María",
      "Ñuñoa",
      "#2563EB",
      "SΜ"
    );
    var a = driver(
      "carlos",
      "Carlos",
      "González",
      "Hyundai",
      "H1",
      20,
      "ABCD-12",
      ProfileStatus.APROBADO,
      List.of("Macul", "Ñuñoa", "Peñalolén"),
      List.of(san, santa)
    );
    var b = driver(
      "patricia",
      "Patricia",
      "Muñoz",
      "Mercedes-Benz",
      "Sprinter",
      16,
      "EFGH-34",
      ProfileStatus.APROBADO,
      List.of("La Florida", "Macul"),
      List.of(san)
    );
    driver(
      "rodrigo",
      "Rodrigo",
      "Soto",
      "Peugeot",
      "Boxer",
      20,
      "JKLM-56",
      ProfileStatus.PENDIENTE_VERIFICACION,
      List.of("Maipú"),
      List.of(santa)
    );
    var d = driver(
      "andrea",
      "Andrea",
      "Rojas",
      "Ford",
      "Transit",
      12,
      "PQRS-78",
      ProfileStatus.APROBADO,
      List.of("Macul", "Ñuñoa"),
      List.of(san, santa)
    );
    occupied(a, otherGuardian, san, 12);
    occupied(b, otherGuardian, san, 8);
    occupied(d, otherGuardian, san, 12);
    var notice = new Notification();
    notice.userId = guardian.id;
    notice.title = "Bienvenida a FurgonApp";
    notice.message =
      "Guarda tu colegio y encuentra un transporte para tu familia.";
    r.notifications().save(notice);
  }

  private User user(String email, String first, String last, Role role) {
    var u = new User();
    u.email = email + "@furgonapp.demo";
    u.firstName = first;
    u.lastName = last;
    u.role = role;
    u.rut = "12.345.678-5";
    u.phone = "+56 9 1234 5678";
    u.passwordHash = passwords.encode("FurgonDemo2026!");
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
    i.address = "Av. Central 1450";
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
      doc.filename = t.name().toLowerCase() + "-demo.txt";
      doc.contentType = "text/plain";
      doc.content = (
        "DOCUMENTO DEMOSTRATIVO FURGONAPP — " +
        t +
        " — Sin validez oficial"
      ).getBytes(StandardCharsets.UTF_8);
      r.documents().save(doc);
    }
    return d;
  }

  private void occupied(
    DriverProfile d,
    User guardian,
    Institution institution,
    int count
  ) {
    var v = r.vehicles().findByDriverId(d.id).orElseThrow();
    for (int n = 0; n < count; n++) {
      var q = new Quote();
      q.driverId = d.id;
      q.guardianId = guardian.id;
      q.institutionId = institution.id;
      q.address = "Dirección demostrativa " + n;
      q.commune = institution.commune;
      q.suggestedPrice = new BigDecimal("75000");
      q.offeredPrice = q.suggestedPrice;
      q.status = QuoteStatus.ACEPTADA;
      r.quotes().save(q);
      var c = new Contract();
      c.quoteId = q.id;
      c.guardianId = guardian.id;
      c.driverId = d.id;
      c.vehicleId = v.id;
      c.institutionId = institution.id;
      c.monthlyPrice = q.offeredPrice;
      r.contracts().save(c);
    }
  }
}
