# FurgonApp

Plataforma de transporte escolar con Next.js/React/TypeScript, Spring Boot 3/Java 17 y PostgreSQL. Incluye registro e inicio de sesión con contraseña, permisos por rol, perfiles de furgonistas, revisión de documentos, instituciones, búsqueda con Google Maps, cotizaciones y reserva atómica de cupos.

## Iniciar en Windows

Requisitos: Java 17 y Node.js 20.9 o superior. Desde esta carpeta:

```powershell
.\start.ps1
# Si ya se compiló:
.\start.ps1 -SkipBuild
```

Abre http://127.0.0.1:3000. El script descarga Maven si hace falta, compila, genera secretos locales y arranca ambos servicios. No debe haber otras instancias en 3000/8080. Los procesos y logs se guardan en .tools/. El antiguo start-demo.ps1 redirige a este arranque, sin acceso demo.

La base local persistente es backend/data/furgonapp-accounts.mv.db (H2). La base anterior de demostración se conserva sin utilizarla. PostgreSQL sigue siendo el motor configurado por defecto para despliegue; esta ejecución local no constituye una validación en PostgreSQL.

## Presentación ante el profesor

Ejecuta `.\start.ps1 -Presentation` para crear cuatro cuentas preparadas, un colegio y un furgonista aprobado con 16 cupos. Consulta las [credenciales, el guion y la explicación del sistema](docs/PRESENTACION.md). La carga es opcional, local y no borra cuentas ni reinicia el avance.

## Cuentas y registro

El primer arranque sobre la base vacía crea exactamente cuatro cuentas: admin@furgonapp.local, apoderado@furgonapp.local, furgonista@furgonapp.local y colegio@furgonapp.local. Cada una tiene una contraseña aleatoria distinta, disponible exclusivamente en **.tools/CUENTAS-INICIALES.md**. Las contraseñas y el secreto JWT no se suben a Git. No se sobrescriben usuarios ni contraseñas al reiniciar. Respalda tanto los secretos locales como la base de datos.

El registro público permite Apoderado, Furgonista y Colegio. Administrador no es un rol de registro público. En el arranque normal no se cargan colegios, vehículos, documentos aprobados ni contratos ficticios; `-Presentation` habilita expresamente los datos ficticios descritos arriba. El colegio completa su institución y el furgonista su perfil, vehículo y documentos antes de solicitar revisión. El administrador revisa y habilita el perfil.

Las contraseñas usan BCrypt. El correo se normaliza y es único también en la base de datos. El acceso anónimo o con sesión vencida vuelve al formulario de ingreso. Desactivar una cuenta bloquea tanto nuevos ingresos como operaciones con su token existente. La sesión se guarda por pestaña y expira en 8 horas; cerrar sesión borra el token de esa pestaña, sin revocar copias externas.

## Google Maps

Configura GOOGLE_MAPS_BROWSER_KEY en frontend/.env.local y reinicia el frontend. Consulta [la guía](docs/GOOGLE_MAPS.md). El autocompletado usa Google Places (New), obtiene la comuna y muestra el marcador. La cobertura se filtra por comuna. Las variables privadas se excluyen también del contexto Docker.

## Docker / PostgreSQL

Copia .env.example a .env, configura una contraseña de base de datos y un JWT_SECRET aleatorio de al menos 32 caracteres, y ejecuta docker compose up --build. No hay secreto JWT predeterminado ni acceso por rol. No se crean las cuentas locales automáticamente en Docker: para una instalación vacía, habilita app.bootstrap.enabled y proporciona app.bootstrap.admin-password, app.bootstrap.apoderado-password, app.bootstrap.furgonista-password y app.bootstrap.colegio-password mediante configuración privada de Spring. Deshabilita bootstrap después de inicializar. No publiques las credenciales.

## Pruebas

- Backend: mvn clean verify dentro de backend (incluye prueba del flujo con las cuentas de presentación).
- API HTTP: node scripts/test-api.mjs desde esta carpeta; usa una base en memoria en el puerto 8081.
- Navegador: arranca el backend con el perfil test y puerto 8081, el frontend en 3000, y ejecuta npm run test:e2e dentro de frontend (12 pruebas). Las llamadas API de estas pruebas se redirigen a 8081 para no modificar la base del usuario. El perfil test es exclusivamente para pruebas y contiene fixtures conocidos.

## Alcance pendiente

El registro y las cuentas son persistentes y funcionan con contraseña. Aún no están implementados verificación de correo, recuperación/cambio de contraseña, MFA, revocación individual de tokens ni envío de correos. La estimación de precio sigue siendo una referencia simulada; pagos, suscripciones y GPS no están integrados. La revisión documental es manual, sin consulta gubernamental automática. Antes de publicar en Internet hacen falta HTTPS, correo, respaldos, límites compartidos de acceso y validación del despliegue en PostgreSQL.

Más detalles: [API](docs/API.md), [arquitectura](docs/ARCHITECTURE.md) y [validación](docs/VALIDATION.md).
