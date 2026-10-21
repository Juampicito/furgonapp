# Evidencia del sistema - Base de datos

Fuentes reproducibles:

- [Migraciones Flyway](../../../../../backend/src/main/resources/db/migration/).
- [Entidades y repositorios del backend](../../../../../backend/src/main/java/cl/furgonapp/).
- [Configuración de despliegue](../../../../../docker-compose.yml).

V1 define el esquema inicial; V2 normaliza y hace único el correo. Las migraciones V3 (ubicación de instituciones) y V4 (territorio y coordenadas de recogida) existen en la copia local y deben publicarse junto con el código correspondiente para ser evidencia remota.

La ejecución local usa H2 persistente en modo PostgreSQL. PostgreSQL es el objetivo configurado para despliegue, pero no hay una validación PostgreSQL/Docker acreditada en este equipo.

No subir `backend/data/`, respaldos, secretos, archivos reales de conductores ni datos de familias. Se documentará el modelo ER a partir del esquema, y cualquier script de demostración debe contener exclusivamente datos ficticios. No se generan dumps de la base privada como evidencia académica.
