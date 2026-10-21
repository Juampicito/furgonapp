# Instalación, uso y operación

## Instalación local

Consultar primero el [README del proyecto](../../../../README.md) y [PRESENTACION](../../../../docs/PRESENTACION.md) para versiones y opciones exactas. Requisitos: Java 17 o superior compatible con el proyecto, Node.js compatible con Next.js, npm, Git y PowerShell en Windows. Maven o las herramientas de arranque del repositorio preparan el backend.

Desde la raíz, `./start.ps1 -Presentation` prepara el entorno local y las cuatro cuentas de presentación. El modo de presentación utiliza datos ficticios; no debe convertirse en configuración pública. Verificar frontend en `http://127.0.0.1:3000` y API en el puerto 8080. Revisar el estado de ambos procesos cuando el navegador no carga. No confundir una pestaña abierta con un servicio activo. No copiar credenciales ni base privada al portafolio.

## Google Maps

La configuración exacta se documenta en [GOOGLE_MAPS](../../../../docs/GOOGLE_MAPS.md) y archivos de ejemplo. Guardar la clave en el archivo privado indicado para el entorno; no en el código ni en documentos de entrega. La clave destinada a JavaScript del navegador es visible para quien usa la aplicación: debe restringirse a los orígenes y APIs necesarias en Google Cloud. Configurar Maps JavaScript y Places según la implementación. No se registra aquí ningún valor de clave.

Revisar en el navegador: autocompletado, selección de dirección, coordenadas, marcador y mapa de instituciones. Para territorio comprobar primero el estado vacío, luego guardar un área, recargar y editarla. Si el mapa falla, comprobar configuración de proveedor y consola sin publicar capturas con secretos o datos personales.

## Uso por rol

**Colegio:** registrarse, completar nombre y datos de contacto, seleccionar dirección de Google y guardar institución. Verificar marcador antes de confirmar. **Furgonista:** completar perfil y vehículo, cargar documentación, seleccionar instituciones atendidas y delimitar recogida en el mapa. Cerrar el polígono, revisar el área y guardar. La revisión administrativa debe aprobar el perfil antes del flujo habilitado. **Apoderado:** buscar el nombre de una institución, elegir una sugerencia, revisar su marcador, indicar recogida, comparar resultados y solicitar cotización. Aceptar una oferta válida crea el contrato y consume disponibilidad. **Administrador:** revisar información y documentación; aprobar o rechazar con observaciones reales, sin atribuir validación gubernamental al sistema.

El tutorial de cobertura permite ver el movimiento del cursor y escuchar la explicación. El territorio se refiere a la zona de recogida; no reemplaza la selección de colegios atendidos.

## Docker y servidor objetivo

El repositorio contiene Compose y configuración para PostgreSQL. Crear configuración privada a partir de ejemplos; generar secretos propios, usar credenciales de base no predeterminadas y desactivar inicialización de cuentas tras su uso. Ejecutar `docker compose up --build` solo después de revisar esa configuración. Los puertos publicados en loopback están orientados a ejecución local; para acceso público se requiere proxy inverso, dominio, HTTPS, políticas de acceso y observación del servicio.

Registrar antes de acreditar despliegue: commit, versiones de runtime e imágenes, migraciones aplicadas, comprobaciones de salud, evidencia de API y frontend, prueba con PostgreSQL y procedimiento de recuperación. Sebastian tiene asignada la documentación y preparación del despliegue; esa asignación no demuestra que el servidor ya esté validado.

## Respaldos y mantenimiento

Respaldar PostgreSQL y probar restauración en un entorno aislado antes de afirmar recuperación. Establecer periodicidad, retención, permisos y responsable. No incorporar respaldos con familias o documentos de conductores a Git. Revisar vencimientos de claves, dependencias y logs. Para recuperar una demostración caída, revisar primero procesos y puertos; preservar datos persistentes y no borrar carpetas de base como medida genérica.

## Innovación y continuidad

La aportación del prototipo combina selección de institución, ubicación de recogida, cobertura territorial y reserva de cupos. El territorio afina el alcance frente a una comuna completa, y las sugerencias toleran diferencias de escritura. El beneficio esperado es reducir solicitudes incompatibles; no se ha medido todavía su magnitud ni demostrado originalidad de mercado. Continuidad: evidencia del servidor, pruebas de carga y seguridad, validación con usuarios y ajustes de accesibilidad antes de ampliar a pagos o GPS.
