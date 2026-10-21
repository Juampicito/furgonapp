# Especificación de requisitos y aceptación

Corte: 21 de octubre de 2026. Esta especificación describe el prototipo y la ampliación geográfica de la copia local. No reemplaza una validación de requisitos con usuarios finales. Las instituciones con ubicación y los territorios dependen de cambios de aplicación aún pendientes de publicación al preparar este portafolio.

## Actores y alcance

El apoderado solicita transporte; el furgonista configura y ofrece su servicio; el colegio mantiene su institución; el administrador revisa documentos y habilita cuentas. No hay un actor estudiante con acceso independiente. El servicio coordina solicitudes y cupos; no procesa pagos ni rastrea vehículos por GPS.

| ID | Requisito | Criterio de aceptación observable | Evidencia de implementación |
|---|---|---|---|
| RF01 | Registrar e identificar cuentas | Correo normalizado único; contraseña válida; el registro público no permite ADMIN | AccountService, UserService y AccountIntegrationTest |
| RF02 | Autorizar por rol y propietario | Una cuenta no puede editar recursos ajenos ni usar acciones de otro rol | Controladores, servicios y pruebas de cuentas/flujo |
| RF03 | Registrar la institución con dirección | Nombre, dirección, región, comuna y ubicación de Google son obligatorios; coordenadas válidas | Requests, InstitutionService, migración V3 e InstitutionLocationIntegrationTest |
| RF04 | Encontrar una institución | Buscar parte del nombre o una variante con errores propone instituciones del listado; elegir una centra el mapa | Buscador de instituciones y componente institution-map |
| RF05 | Mantener conductor y vehículo | Perfil asociado a su usuario; patente única; capacidad entre 1 y 60; cambios relevantes requieren nueva revisión | DriverService, Vehicle y migración V1 |
| RF06 | Revisar documentación | El administrador revisa los tipos requeridos y el estado; solo un conductor aprobado puede participar del flujo habilitado | AdminService, DriverService y pruebas de flujo |
| RF07 | Guardar territorio | Guardar de 3 a 100 vértices válidos; rechazar polígonos degenerados o con intersecciones | Territory, DriverService, V4 y TerritoryTest |
| RF08 | Buscar por colegio y punto | Un conductor con territorio solo aparece si el punto de recogida pertenece al área y atiende la institución | DriverService y TerritoryIntegrationTest |
| RF09 | Cotizar y ofrecer | Una solicitud conserva institución, dirección, participantes y estado; solo el conductor destinatario puede responder | QuoteService y WorkflowIntegrationTest |
| RF10 | Aceptar y reservar un cupo | Revalidar aprobación, institución, cobertura y cupos en la transacción; impedir contrato duplicado por cotización | QuoteService y restricciones SQL |
| RF11 | Informar cambios del flujo | El destinatario puede consultar las notificaciones internas asociadas al proceso | Notification y servicios; no equivale a email/push |
| RF12 | Ayudar a dibujar cobertura | El conductor puede acceder al tutorial narrado con movimiento visible del cursor | Página de cobertura y recursos del tutorial locales |

## Requisitos no funcionales

| ID | Condición | Verificación y límite |
|---|---|---|
| RNF01 Seguridad de acceso | JWT, BCrypt y controles de propietario/rol | Revisar respuestas 401/403 y ausencia de acceso cruzado; no es una auditoría integral |
| RNF02 Integridad | Claves foráneas, unicidad y transacción de aceptación | Pruebas de duplicación/capacidad; completar evaluación concurrente sobre PostgreSQL |
| RNF03 Configuración segura | Secretos fuera de Git; clave browser de Maps restringida | Revisar exclusiones y restricciones del proveedor sin imprimir valores |
| RNF04 Reproducibilidad | Dependencias, migraciones, instrucciones y perfiles explícitos | Arranque local repetible; Docker/PostgreSQL objetivo aún requieren evidencia de ejecución |
| RNF05 Comprensión del flujo | Sugerencias de búsqueda, mapa y tutorial | Comprobación funcional en navegador; falta estudio de usabilidad con usuarios |
| RNF06 Rendimiento | Definir carga y medir antes de fijar compromiso | Propuesta: p95 menor de 2 s para consultas bajo carga acordada; objetivo pendiente, no resultado |
| RNF07 Operación | HTTPS, respaldos y recuperación verificable | Pendiente en servidor público; un archivo Compose no prueba operación productiva |

## Trazabilidad del cambio geográfico

La versión inicial usaba comunas. La ampliación exige seleccionar una dirección de institución con coordenadas y dibujar un territorio de recogida. Se conserva compatibilidad de perfiles antiguos por comuna hasta guardar el primer territorio. Para perfiles con polígono, omitir el punto no habilita una coincidencia por comuna. Las instituciones atendidas siguen siendo una selección independiente del área de recogida.

Prioridad de cierre: publicar los cambios de código correspondientes; verificar flujos reales de Google Maps; probar PostgreSQL y concurrencia; medir carga y seguridad; cotejar con las rúbricas del curso. No se documentan acuerdos ni aprobaciones del cliente que no estén registrados.
