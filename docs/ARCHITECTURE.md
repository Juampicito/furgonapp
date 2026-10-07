# Arquitectura de FurgonApp

## Decisiones de esta iteración

Un monolito modular Spring Boot 3.5 / Java 17 y una aplicación Next.js 16 / React 19 / TypeScript. Hay un único proceso backend y una única base de datos. No se incorporan microservicios ni colas externas.

Los paquetes de dominio son `auth`, `users`, `drivers`, `vehicles`, `documents`, `media`, `coverage`, `institutions`, `guardians`, `pricing`, `quotes`, `contracts`, `notifications`, `administration` y `payments`. Cada módulo contiene sus entidades, repositorios y, cuando corresponde, controlador y servicio. `shared` reúne errores, DTOs, auditoría y una consulta agregada para los paneles.

Los servicios coordinan repositorios mediante un contenedor tipado `Repositories`, sin reflexión ni búsquedas dinámicas. Es un compromiso de la primera iteración para mantener las operaciones entre módulos dentro de una transacción. Si crece el sistema, sustituir gradualmente las lecturas cruzadas por interfaces públicas de cada módulo y verificar dependencias con Spring Modulith o ArchUnit.

En frontend, `features/` separa los paneles y flujos; `components/` contiene componentes y el contexto de sesión; `lib/api.ts` es el adaptador HTTP. React no calcula precios ni decide disponibilidad definitiva. No hay un segundo backend implementado en Next.js: `/api/*` se reenvía a Spring.

## Relaciones y datos

- `User` representa exclusivamente ADMIN, FURGONISTA, APODERADO o COLEGIO. No existe rol estudiante.
- `DriverProfile.userId` es único. `Vehicle.driverId` es único en esta primera versión.
- `CoverageArea` permite varias comunas por furgonista y reserva campos para GeoJSON, coordenadas y radio.
- `DriverInstitution` relaciona transportistas e instituciones de muchos a muchos.
- `GuardianInstitution` relaciona apoderados e instituciones de muchos a muchos, con restricción única sobre la pareja.
- Los datos personales del apoderado están en `User`; la relación a instituciones constituye su perfil específico. No se duplica nombre, correo ni dirección en otra tabla.
- La institución tiene un propietario y sus colores de tema integrados. No se necesita otra entidad para dos colores y un logo.
- `Quote` conserva la dirección, comuna, estimación y oferta como instantánea del acuerdo.
- `Contract.quoteId` es único. Cada contrato activo ocupa un asiento del vehículo. `studentId` es nullable y reservado para una ampliación futura, sin rol de acceso asociado.
- Todos los identificadores son UUID y todas las entidades persistentes incluyen `createdAt` y `updatedAt`.

Las relaciones entre agregados usan UUID explícitos y claves foráneas en la migración Flyway, en lugar de grafos JPA expuestos por JSON. Se evita así cargar accidentalmente documentos o contraseñas. Los DTOs de perfil público omiten RUT, contacto privado, archivos y credenciales. Los contactos del apoderado solo se entregan a él, al transportista de su solicitud o al administrador.

## Concurrencia y cupos

No se persiste `cuposDisponibles` ni un contador paralelo de ocupación. Se calcula `Vehicle.capacity - COUNT(Contract WHERE status = ACTIVO)`.

La aceptación se ejecuta en `QuoteService.accept`, con una única transacción y este orden de bloqueos:

1. Cotización con `PESSIMISTIC_WRITE` (impide resolver dos veces la misma oferta).
2. Perfil del furgonista con `PESSIMISTIC_WRITE` (coordina revisiones y cambios de vehículo/cobertura).
3. Vehículo con `PESSIMISTIC_WRITE` (serializa las reservas de ese vehículo).
4. Revalidación de aprobación, cuenta activa, institución, comuna y capacidad.
5. Inserción de contrato, aceptación de la cotización y notificaciones, con commit conjunto.

La edición de capacidad toma los bloqueos de perfil y vehículo en el mismo orden, y nunca permite un valor menor al número de contratos activos. La restricción única sobre `quote_id` agrega una protección en base de datos. Todas las altas de contratos del negocio pasan por este servicio; las herramientas de mantenimiento deben respetar el mismo protocolo de bloqueo.

## Seguridad

- JWT HS256 firmados con Nimbus y validados por Spring Security (firma, emisor, caducidad).
- Clave requerida de al menos 32 caracteres; el arranque local genera un secreto aleatorio privado.
- Contraseñas con BCrypt; el JWT dura ocho horas y la sesión de la interfaz vive en `sessionStorage`.
- Restricciones por rol y comprobación de propietario en servicios. La cuenta activa se consulta nuevamente, incluso si ya existe un JWT.
- Acceso rápido eliminado; registro público para tres roles, ADMIN solo mediante aprovisionamiento privado.
- Archivos documentales en la base de datos, descarga autenticada y `Cache-Control: no-store`. Archivos de hasta 5 MB, PDF/PNG/JPEG; fotografías y logos públicos separados en `MediaAsset`.
- Cambiar identidad, vehículo, foto o documentos invalida la aprobación del perfil.
- El colegio puede consultar transportistas asociados, sin acceder a contratos ni cotizaciones de las familias.
- El perfil test carga fixtures aislados. El arranque local normal crea cuatro cuentas sin datos ficticios; la opción explícita `-Presentation` habilita `PresentationData` solo en el perfil local, con cuatro cuentas adicionales y un escenario preparado que conserva su avance.

Pendientes para un despliegue público: verificación de correo, recuperación/cambio de contraseña, revocación/rotación de tokens, MFA administrativo, auditoría detallada, almacenamiento externo y análisis de archivos, paginación, observabilidad y HTTPS. El registro público y login tienen interfaz y API funcionales; existe un límite de intentos por proceso que debe reemplazarse por uno compartido al escalar.

## Servicios sustituibles

- `PricingService`: estimación simulada de $75.000 CLP. `MAX_PRICE_DEVIATION_PERCENTAGE` controla el margen permitido, sin duplicarlo en React.
- `GeocodingService`: valida que dirección y comuna estén presentes. El frontend obtiene ambos datos mediante Google Places (New), muestra las coordenadas en Google Maps y envía la dirección y comuna elegidas. El backend no certifica el domicilio ni hace una segunda consulta a Google; la cobertura sigue comprobándose por comuna. Las coordenadas y el Place ID se usan en el mapa durante la selección, sin persistirse en la cotización.
- `DocumentValidationService`: validación administrativa manual sustituible por otro proveedor.
- Notificaciones internas persistentes; no envían correo, WhatsApp ni push.
- `Student`, `Payment`, `Subscription` y `PaymentStatus` son contratos de dominio conceptuales; no generan cobros ni tablas operativas prematuras.

## Temas y experiencia

Una misma pantalla institucional usa `--institution-primary`, `--institution-secondary`, `--on-primary` y `--on-secondary`. El color de texto se elige mediante luminancia relativa para priorizar contraste. Éxito y error tienen colores semánticos independientes. Los diálogos usan `<dialog>` nativo, etiquetas de formulario, mensajes `role=alert/status`, foco visible y preferencias de movimiento reducido.

## Persistencia y evolución

PostgreSQL es la base objetivo. Flyway aplica las migraciones V1 y V2 (normalización y restricción de correo); Hibernate valida el esquema y no lo recrea. H2 en modo PostgreSQL permite una instalación local persistente sin Docker; no pretende sustituir las pruebas finales en PostgreSQL. Las cuentas iniciales se crean solo sobre una base vacía y no se reinician al arrancar. La base local de cuentas está separada de la antigua demo.

Las consultas agregadas actuales privilegian claridad y el tamaño pequeño de la demo. Para grandes volúmenes se requieren paginación, proyecciones SQL de búsqueda y agregaciones de contratos para evitar consultas por cada card.
