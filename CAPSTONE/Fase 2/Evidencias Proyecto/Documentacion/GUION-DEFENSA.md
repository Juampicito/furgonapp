# Guion de ensayo de la defensa

Propuesta para aproximadamente 20 minutos incluidas preguntas, según Información EA3. Ajustar durante el ensayo. Ambos integrantes deben explicar el conjunto. Los apartados en inglés se practican de forma equitativa. No se atribuye una defensa ya realizada.

| Minutos | Participante | Contenido |
|---|---|---|
| 0–2 | Juan Pablo | Problema y alcance; problema en inglés |
| 2–4 | Sebastian | Solución y usuarios; solución en inglés |
| 4–6 | Juan Pablo | Caso de uso y reglas, en inglés |
| 6–8 | Sebastian | Arquitectura y entorno, en inglés |
| 8–10 | Juan Pablo | Demostración de institución, recogida y territorio |
| 10–12 | Sebastian | Cotización, evidencias y reproducibilidad |
| 12–14 | Ambos | Resultados, límites y continuidad |
| 14–20 | Ambos | Preguntas |

## Texto base en inglés

**Juan Pablo — problem:** “Families need to find a school transport driver who serves their school and pickup location. Drivers need to define where they work and how many seats they can offer. FurgonApp addresses this coordination problem in a web prototype. We do not claim a measured market impact or a fully verified production service.”

**Sebastian — solution:** “The platform has four roles: guardian, driver, school and administrator. A school registers its institution, a driver completes a profile and working area, and an administrator reviews documents. A guardian can search for a compatible driver and request a quote. Document review is manual. Payments and live GPS tracking are outside this version.”

**Juan Pablo — use case:** “The guardian selects a school and a pickup point. The application searches for drivers who serve that school and cover that location. After a quote and an offer, the guardian can accept. The backend checks approval, geographic coverage and available seats again before creating a contract. This prevents the browser from being the only place where business rules are checked.”

**Sebastian — architecture:** “The browser uses Next.js and React. It communicates with a Spring Boot REST API. JPA manages relational persistence and Flyway manages schema migrations. Google Maps supports address selection and geographic interaction. H2 is used for the local run; PostgreSQL is the deployment target. We must verify that target environment separately before claiming production readiness.”

Intercambiar los cuatro fragmentos en otro ensayo para que ambos cubran todos los apartados. Juan Pablo agrega decisiones de transacción y datos; Sebastian explica configuración y evidencia del despliegue. Relacionar cada afirmación con un archivo u operación del sistema.

## Demostración

Usar cuentas y datos ficticios del modo de presentación. Mostrar institución y marcador, buscarla con una variante del nombre, guardar territorio y comparar recogidas dentro y fuera. Mostrar cotización y aceptación con disponibilidad. Preparar un caso inválido sin usar documentos reales. No mostrar secretos de configuración.

Si falla Maps, explicar dependencia y estado; identificar las capturas como evidencia histórica, sin presentarlas como funcionamiento actual. Revisar frontend y backend antes de reiniciar; no borrar la base como solución genérica.

## Preguntas para practicar

- ¿Por qué un territorio? Mayor precisión de recogida; implica validar geometría.
- ¿Cómo se controlan cupos? Transacción, bloqueo y revalidación; prueba PostgreSQL aún pendiente.
- ¿Aprobación garantiza legalidad? Es revisión administrativa manual, sin consulta gubernamental.
- ¿Qué hizo cada integrante? Relacionar roles informados con archivos y decisiones.
- ¿Qué falta para producción? Acreditar servidor, PostgreSQL, HTTPS, respaldos, carga y seguridad.
