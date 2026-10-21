# Plan y evidencia de pruebas

## Alcance y entorno

Verificar cuentas, permisos, instituciones, geometría, búsqueda, cotización y reserva. Las pruebas deben usar datos ficticios y una base aislada; no borrar la base de demostración del usuario. Las pruebas del navegador redirigen la API al puerto 8081 cuando se usa el entorno de test. Los resultados históricos no se presentan como una ejecución nueva.

## Casos de aceptación prioritarios

| Caso | Preparación / acción | Resultado esperado |
|---|---|---|
| P01 | Registrar el mismo correo con mayúsculas o espacios | Rechazar duplicación de identidad |
| P02 | Acceder a recursos de otro propietario o rol | Denegar sin devolver ni modificar datos ajenos |
| P03 | Registrar institución sin ubicación válida | Rechazar; una ubicación válida persiste tras recarga |
| P04 | Buscar fragmento de nombre, nombre sin «colegio» o error tipográfico | Sugerir coincidencias del listado; seleccionar centra la institución |
| P05 | Abrir cobertura sin puntos guardados | Cargar el mapa y permitir comenzar un área vacía |
| P06 | Guardar área de menos de 3 puntos, degenerada o cruzada | Rechazar sin persistir geometría inválida |
| P07 | Buscar puntos dentro, fuera y en borde de territorio | Coincidencia geográfica conforme a la regla; borde incluido |
| P08 | Buscar sin punto para conductor con territorio | No recuperar por simple coincidencia de comuna |
| P09 | Intentar aceptar con conductor no aprobado, colegio ajeno o sin cupos | No crear contrato |
| P10 | Repetir la aceptación de la misma cotización | No duplicar contrato |
| P11 | Competir por el último cupo | A lo sumo una reserva nueva; verificar también con PostgreSQL |
| P12 | Cerrar y reabrir aplicación | Conservar datos persistentes del perfil correspondiente |

## Resultado histórico disponible

La tabla de [RESULTADOS-PRUEBAS.md](RESULTADOS-PRUEBAS.md) se genera leyendo los XML locales de Surefire. La fecha corresponde al reporte, no a esta preparación documental. No se incluyen registros que contengan datos sensibles ni se atribuyen estas pruebas a un servidor productivo.

Hay pruebas de navegador y comprobaciones manuales locales. Las simulaciones de Google Maps facilitan aislar UI y API, pero deben complementarse con una prueba real del proveedor: clave autorizada, dirección seleccionada, mapa vacío, carga y error. Un HTTP 200 de la página no demuestra que el mapa haya renderizado.

## Ejecución reproducible

Backend: ejecutar `mvn clean verify` en `backend`. API: revisar `scripts/test-api.mjs`, que emplea una base de prueba en memoria. Navegador: revisar la configuración Playwright y usar backend de test en 8081 con frontend en 3000; ejecutar `npm run test:e2e` en `frontend`. Confirmar dependencias del entorno antes de ejecutar. No se afirma en este portafolio que la suite completa de navegador se haya ejecutado de nuevo.

## Rendimiento: diseño pendiente de ejecutar

Entorno propuesto: PostgreSQL y versiones de aplicación registradas, datos ficticios representativos y máquina identificada. Escenario inicial: 10, 25 y 50 usuarios concurrentes durante cinco minutos por escalón, tras calentamiento; 80 % búsquedas y 20 % consultas propias. Separar latencia de Maps de latencia de API. Medir p50/p95/p99, errores, CPU, memoria y consultas SQL. Objetivo propuesto a acordar: p95 menor de dos segundos en consultas y menos de 1 % de errores inesperados. No hay mediciones acreditadas ni compromiso de capacidad con estos valores.

Para aceptación concurrente, crear ofertas que compitan por un único cupo y comprobar el total de contratos al terminar. No generar transacciones económicas reales. Conservar comandos, versión, semilla, resultados y errores sin secretos.

## Seguridad: verificación pendiente de ampliar

Revisar acceso horizontal/vertical, JWT inválido o vencido, cuentas inactivas, registro administrativo, carga de documentos, validación de entradas y límites de solicitudes. Revisar exclusión de secretos, dependencia vulnerable y configuración HTTPS/CORS del despliegue. Las comprobaciones funcionales de permisos existentes no equivalen a un pentest. Registrar hallazgo, riesgo, corrección y repetición de caso; no declarar «sistema seguro» con base en ausencia de fallos de una suite.

## Criterio de salida

Cerrar casos críticos de identidad, propiedad, geometría y cupos; documentar los fallos abiertos; ejecutar sobre PostgreSQL objetivo; acreditar configuración de Maps real; vincular reportes a un commit. Si falta uno de esos resultados, comunicar el alcance que sí está probado y mantener el pendiente.
