# Validación de la primera iteración

Verificado el 23 de septiembre de 2026 en Windows, con Java 17.0.19, Node.js 24.17.0 y Microsoft Edge. Las pruebas utilizaron el backend real y H2, con migraciones Flyway y validación Hibernate.

| Verificación | Resultado |
|---|---|
| `mvn verify` | Correcto; JAR ejecutable generado |
| JUnit / Spring Boot / MockMvc | 11 pruebas aprobadas, 0 fallos |
| `node --test scripts/test-api.mjs` | 11 pruebas HTTP aprobadas, 0 fallos |
| `npm run build -- --webpack` | Build de producción y comprobación TypeScript correctos |
| Playwright en Edge | 4 pruebas aprobadas, 0 fallos |
| Escritorio a 1440 px | Captura revisada visualmente |
| Móvil a 390 px | Cuatro perfiles sin desbordamiento horizontal de página |

## Recorrido real comprobado en navegador

1. Editar Colegio San Marcos, seleccionar verde/blanco y subir un logo PNG.
2. Guardar la institución como apoderado y comprobar su color en la pantalla de búsqueda.
3. Buscar en Macul: Carlos y Patricia visibles; pendiente y vehículo lleno excluidos.
4. Solicitar cotización desde el perfil público y ver la estimación de $75.000.
5. Abrir la solicitud como furgonista y comprobar los datos de contacto.
6. Intentar oferta de $100.000: rechazada por el backend.
7. Enviar oferta de $78.000 y aceptarla como apoderado.
8. Ver contrato activo y un cupo reservado; Carlos cambia de 12/20 a 13/20.
9. Consultar ese contrato desde Administración.
10. Editar vehículo/cobertura, reemplazar un documento, solicitar revisión y aprobar documento y perfil desde Administración.

Además se verificó la redirección de una URL administrativa cuando la sesión pertenece a un apoderado.

## Casos críticos comprobados en backend

- Dos aceptaciones simultáneas para un solo cupo producen exactamente un éxito y un HTTP 409.
- Aceptar dos veces la misma cotización no duplica el contrato.
- No se permite reducir capacidad por debajo de la ocupación actual.
- El precio máximo se valida en servidor; cero y ofertas por encima del margen se rechazan.
- Un apoderado y otro furgonista no pueden descargar documentos ajenos.
- Reemplazar o rechazar documentos invalida la aprobación pública.
- Aprobar un perfil con documentación pendiente falla.
- Una cuenta desactivada pierde acceso incluso con un JWT previamente emitido.
- El colegio no recibe las cotizaciones ni contratos de las familias.
- Guardar varias instituciones funciona y no genera duplicados.

## Evidencia visual

- `screenshots/furgonista-desktop.png`: dashboard después de aceptar la oferta, con 13/20 ocupados.
- `screenshots/apoderado-mobile.png`: institución guardada y navegación responsive.

## Límites de esta validación

No se ejecutó Docker ni PostgreSQL en esta máquina porque Docker no estaba instalado. Se entregan Dockerfiles, Compose y la migración PostgreSQL; falta comprobar ese despliegue en un entorno con Docker. Las pruebas de concurrencia se ejecutaron con H2 y deben repetirse contra PostgreSQL antes de un despliegue real.

El script de arranque PowerShell se comprobó sintácticamente; las instancias utilizadas para las pruebas se iniciaron directamente con Java y npm. No se probaron pagos ni servicios gubernamentales porque están fuera del alcance solicitado. La integración posterior de Google Maps se valida por separado, incluyendo una consulta real con la clave del propietario.

La demo quedó con un contrato nuevo y el perfil de Carlos aprobado después de la revisión. También pueden existir solicitudes abiertas de los recorridos de comprobación; son datos demo persistentes, visibles desde los paneles.
## Integración de Google Maps — 23 de septiembre de 2026

Compilación de producción y verificación TypeScript correctas. Cinco pruebas nuevas de Playwright aprobadas (`npx playwright test tests/maps.spec.ts`): configuración ausente con bloqueo y vista móvil sin desbordamiento; selección de dirección y búsqueda por la comuna retornada con invalidación al editar; fallo de red; prioridad de comuna chilena sobre ciudad/provincia; rechazo tardío de autorización de Google que invalida la selección. Se usó un doble del SDK de Google exclusivamente en tests. Las pruebas no crean cotizaciones ni modifican los datos demo existentes.

Prueba real posterior: respuestas HTTP 200 de Google AutocompletePlaces y GetPlace para Avenida Macul; dirección y comuna Macul mostradas, marcador visible y dos furgonistas encontrados. Captura: `screenshots/google-maps-live.png`. Se corrigió un conflicto de React con el contenido que Google reemplaza al crear el mapa, separando el contenedor del SDK del estado de carga; el doble de pruebas ahora reproduce ese reemplazo. Se repitieron las cinco pruebas y la compilación correctamente.

## Registro y cuentas persistentes — 28 de septiembre de 2026

18 pruebas Java y 12 pruebas Playwright aprobadas. Cobertura nueva: registro de los tres roles públicos, login y logout, contraseñas BCrypt, duplicados de correo, restricciones de contraseña, rechazo de ADMIN público, eliminación del acceso demo, desactivación de cuentas y aislamiento por rol. Las pruebas de navegador usan el backend de pruebas en 8081 y no escriben en la base local. Se comprobó además el ingreso y workspace de las cuatro cuentas iniciales reales: exactamente cuatro usuarios, sin cotizaciones, contratos ni instituciones ficticias. Capturas de login y registro revisadas visualmente. La persistencia local usa H2; PostgreSQL/Docker no se ejecutaron en este equipo.
