# FurgonApp

Primera iteración funcional de una plataforma de transporte escolar. Incluye los cuatro perfiles, identidad visual de colegios, documentación privada, cobertura, búsqueda compatible, cotizaciones, ofertas, contratos, reserva transaccional de cupos y supervisión administrativa.

**Frontend:** Next.js 16, React 19, TypeScript y Tailwind CSS 4. **Backend:** Java 17, Spring Boot 3.5, Spring Security, JWT, JPA/Hibernate y Flyway. **Base objetivo:** PostgreSQL. Monolito modular, sin microservicios.

## Abrir la aplicación

La aplicación utiliza [http://127.0.0.1:3000](http://127.0.0.1:3000). El backend escucha en [http://127.0.0.1:8080/api/health](http://127.0.0.1:8080/api/health).

### Inicio rápido en Windows

Requiere Node.js 20.9 o superior y Java 17 o superior. Desde la carpeta `furgonapp`:

```powershell
.\start-demo.ps1
```

El script descarga Maven si no está instalado, verifica el archivo con SHA-512, instala las dependencias, ejecuta las pruebas del backend, compila y arranca ambos procesos en segundo plano. Muestra sus identificadores y guarda los logs en `.tools/logs/`. No modifica instalaciones globales.

Si ya están compilados el frontend y el JAR, puedes reutilizarlos:

```powershell
.\start-demo.ps1 -SkipBuild
```

El script no reemplaza procesos existentes: avisa si los puertos 3000 u 8080 están ocupados. Para detener una instancia iniciada por el script, utiliza los PID que imprimió: `Stop-Process -Id <PID_BACKEND>,<PID_FRONTEND>`.

### Inicio manual sin Docker

Terminal 1, desde `backend/`:

```sh
mvn verify
java -jar target/furgonapp-0.1.0.jar --spring.profiles.active=demo
```

Terminal 2, desde `frontend/`:

```sh
npm ci
npm run dev
```

Para ejecutar la compilación optimizada: `npm run build`, seguido de `npm start`.

El perfil `demo` utiliza H2 en modo PostgreSQL y conserva los datos en `backend/data/`. Las cotizaciones, instituciones y documentos sobreviven a los reinicios. No hay almacenamiento de negocio en localStorage. La interfaz usa la misma API real en ambos modos de base de datos.

### Ejecutar todo con PostgreSQL y Docker

Desde la raíz del proyecto, con Docker instalado:

```sh
docker compose up --build
```

Esto levanta PostgreSQL, Spring Boot y Next.js. Abre el mismo puerto 3000. La base de datos se conserva en el volumen `postgres_data`. El Compose está configurado para demostración local y publica puertos solamente en la interfaz loopback.

Para levantar solo PostgreSQL:

```sh
docker compose up -d postgres
```

Después, en PowerShell, dentro de `backend/`:

```powershell
$env:APP_DEMO = 'true'
$env:JWT_SECRET = 'una-clave-local-de-al-menos-32-caracteres'
java -jar target/furgonapp-0.1.0.jar
```

Sin el perfil `demo`, la configuración por defecto utiliza PostgreSQL en `localhost:5432/furgonapp`. `APP_DEMO=true` habilita seed y acceso rápido sobre esa base. Para un entorno ajeno a la demo, omite esa variable, proporciona una clave propia y provisiona las cuentas por un canal administrativo; todavía no hay registro público ni recuperación de contraseña.

## Recorrido de demostración

1. **Colegio:** entra como Colegio. Edita San Marcos, elige verde/blanco, carga un logo PNG/JPEG y guarda la institución.
2. **Furgonista:** entra como Furgonista. Revisa los cuatro pasos de “Mi perfil y vehículo”: datos personales, Hyundai H1 con capacidad 20, documentos y cobertura Macul/Ñuñoa. Los datos ya están precargados y se pueden cambiar.
3. **Revisión:** al reemplazar documentos o datos importantes, el perfil pierde su aprobación. Pulsa “Solicitar revisión”. Cambia a Administrador, revisa y aprueba los documentos, y luego aprueba el perfil. No es posible aprobarlo con documentos pendientes o rechazados.
4. **Apoderado:** busca Colegio San Marcos y guárdalo. También puedes guardar Santa María. Entra a San Marcos para ver el tema institucional.
5. Escribe “Los Plátanos 1234”, selecciona Macul y busca. Se muestran Carlos y Patricia; Rodrigo está pendiente y Andrea no tiene cupos.
6. Abre Carlos, revisa vehículo, cobertura, cupos y verificaciones. Solicita una cotización. El valor sugerido simulado es **$75.000 mensuales**.
7. **Furgonista:** abre Cotizaciones. Verás la solicitud y los datos de contacto del apoderado. Envía una oferta de **$78.000**. Con el margen por defecto, una oferta de $100.000 se rechaza.
8. **Apoderado:** abre Mis cotizaciones y acepta la oferta. Confirma la operación en el diálogo.
9. Se crea un contrato activo y se reserva exactamente un asiento: en una base nueva, Carlos pasa de **12/20 a 13/20**. No se realiza ningún cobro.
10. **Administrador:** consulta usuarios, documentos, furgonistas, vehículos, cotizaciones, contratos, cupos y notificaciones.

Los cambios son compartidos entre perfiles. “Cambiar de perfil” cierra la sesión actual y vuelve al selector. Para simular dos personas al mismo tiempo, abre dos pestañas: cada una tiene su JWT en `sessionStorage`. Pulsa “Actualizar panel” para ver cambios realizados desde la otra pestaña.

## Datos iniciales

| Furgonista | Cobertura | Vehículo | Ocupación inicial | Estado |
|---|---|---|---|---|
| Carlos González | Macul, Ñuñoa, Peñalolén | Hyundai H1 | 12/20 | Aprobado |
| Patricia Muñoz | La Florida, Macul | Mercedes-Benz Sprinter | 8/16 | Aprobado |
| Rodrigo Soto | Maipú | Peugeot Boxer | 0/20 | Pendiente de verificación |
| Andrea Rojas | Macul, Ñuñoa | Ford Transit | 12/12 | Aprobado, sin cupos |

La ocupación inicial proviene de contratos demostrativos, no de contadores falsos. Se incluyen dos colegios y una familia adicional para esos contratos. Los archivos del seed indican que son demostrativos; las fotografías iniciales son ilustraciones. Se pueden reemplazar desde la interfaz.

Accesos rápidos: `admin@furgonapp.demo`, `carlos@furgonapp.demo`, `maria@furgonapp.demo` y `sanmarcos@furgonapp.demo`. Todas las cuentas demo tienen la contraseña `FurgonDemo2026!` para probar `POST /api/auth/login`. La interfaz de esta entrega utiliza el selector de roles temporal solicitado.

## Configuración

| Variable | Por defecto | Uso |
|---|---|---|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/furgonapp` | Conexión PostgreSQL |
| `DATABASE_USER` | `furgonapp` | Usuario de base de datos |
| `DATABASE_PASSWORD` | `furgonapp_dev` | Contraseña local |
| `JWT_SECRET` | Obligatoria fuera de demo | Firma de tokens, mínimo 32 caracteres |
| `APP_DEMO` | `false` | Habilita seed y accesos rápidos |
| `MAX_PRICE_DEVIATION_PERCENTAGE` | `25` | Tope de oferta sobre el estimado |
| `FRONTEND_URL` | `http://localhost:3000` | Origen adicional para CORS |
| `API_URL` | `http://127.0.0.1:8080` | Destino del proxy Next.js; establecer antes del build |

El frontend lee el margen del backend. Las estimaciones provienen de `PricingService`; React solo presenta sus resultados. No se confía en límites enviados por el navegador.

## Pruebas

Backend, desde `backend/`:

```sh
mvn verify
```

Incluye 11 pruebas JUnit de integración con Spring Security, JPA y H2: aceptación, duplicados, precios, filtrado, permisos, privacidad, múltiples instituciones, edición de capacidad, revisión documental, desactivación y concurrencia por el último asiento.

Pruebas HTTP contra un proceso Spring Boot real, desde la raíz, con el JAR compilado:

```sh
node --test scripts/test-api.mjs
```

El script inicia automáticamente una base H2 desechable y un backend separado en el puerto 8081, ejecuta 11 casos y lo detiene al terminar. No modifica la base demo abierta en 8080. Se puede usar `TEST_API_URL` para dirigirlo a otra instancia, pero debe ser una base **de pruebas** con seed nuevo: los casos crean contratos y modifican perfiles.

Frontend, desde `frontend/`:

```sh
npm run typecheck
npm run build
npm run test:e2e
```

Playwright utiliza Microsoft Edge y las instancias locales de frontend/backend. Sus pruebas E2E requieren una demo recién sembrada: crean una cotización real, aceptan una oferta, revisan documentos y cargan un logo. Incluyen la navegación de los cuatro perfiles a 390 px y la protección de rutas por rol. Para otros sistemas, cambia `channel: 'msedge'` en `playwright.config.ts` o instala Edge mediante Playwright.

Consulta `docs/VALIDATION.md` para el resultado de las verificaciones de esta entrega. PostgreSQL/Docker deben validarse en un entorno con Docker disponible.

## Organización

```text
furgonapp/
├── frontend/src/
│   ├── app/          # Rutas Next y estilo base
│   ├── components/   # Componentes comunes y sesión
│   ├── features/     # Flujos por dominio
│   └── lib/          # Tipos y adaptador de API
├── backend/src/
│   ├── main/java/cl/furgonapp/  # Módulos de dominio
│   ├── main/resources/         # Configuración y migraciones Flyway
│   └── test/                   # Integración JUnit
├── docs/
├── scripts/
├── docker-compose.yml
└── start-demo.ps1
```

Más detalle en `docs/ARCHITECTURE.md` y `docs/API.md`.

## Alcance actual

Funcionan las operaciones descritas en el recorrido. Se simulan la estimación de precios y la validación documental. La búsqueda de direcciones utiliza Google Places cuando se configura la clave. Los pagos, suscripciones, seguimiento GPS, validación gubernamental, WhatsApp, correo y notificaciones push están fuera de esta iteración. `Student`, `Payment` y `Subscription` dejan preparados los conceptos sin implementar integraciones ficticias.

El archivo H2 y el volumen PostgreSQL son independientes. Para empezar otra demo sin borrar la anterior, detén el backend y usa un nombre nuevo: `--spring.datasource.url=jdbc:h2:file:./data/otra-demo;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`. En PowerShell pasa ese argumento entre comillas.
# Google Maps

La búsqueda de recogida incluye autocompletado real de Google Places y un mapa con marcador. Para activarla, configura una clave de navegador siguiendo [la guía de Google Maps](docs/GOOGLE_MAPS.md). Sin clave, la búsqueda muestra el estado pendiente de activación. La cobertura sigue siendo por comuna y el cálculo de precio sigue siendo demo.
