# API REST

Prefijo: `/api`. Autenticación: `Authorization: Bearer <JWT>`. Los cuerpos JSON se validan en backend; los formularios de archivo usan multipart. Los errores de negocio incluyen `message` y, para validación, `errors`.

| Método y ruta | Permiso | Operación |
|---|---|---|
| `GET /health` | Público | Estado del proceso |
| `GET /auth/config` | Público | Indica si está habilitada la demo |
| `POST /auth/demo` | Solo con demo activa | `{ "role": "APODERADO" }` → JWT y usuario |
| `POST /auth/login` | Público | `{ "email": "...", "password": "..." }` → JWT y usuario |
| `GET /workspace` | Autenticado, cuenta activa | Datos del panel filtrados por rol y propietario |
| `PUT /users/{id}` | Propietario / ADMIN | Nombre, apellido, RUT, teléfono, correo, dirección |
| `GET /drivers/{id}` | Autenticado | Perfil público aprobado; dueño y ADMIN pueden consultar otros estados |
| `PUT /drivers/{id}` | Dueño FURGONISTA / ADMIN | Biografía y foto de perfil |
| `PUT /drivers/{id}/vehicle` | Dueño / ADMIN | Patente, marca, modelo, año, color, capacidad y foto |
| `PUT /drivers/{id}/coverage` | Dueño / ADMIN | Región, comunas e instituciones atendidas |
| `POST /drivers/{id}/documents` | Dueño / ADMIN | Multipart `type` y `file`; reinicia revisión |
| `POST /drivers/{id}/submit` | Dueño / ADMIN | Comprueba integridad y solicita verificación |
| `GET /documents/{id}/content` | Dueño FURGONISTA / ADMIN | Descarga privada |
| `POST /media` | Autenticado | Imagen pública PNG/JPEG, multipart `file` → UUID |
| `GET /media/{id}` | Público | Imagen de perfil, vehículo o logo |
| `POST /institutions` | COLEGIO / ADMIN | Crea la institución del usuario |
| `PUT /institutions/{id}` | Dueño COLEGIO / ADMIN | Actualiza información, logo y colores |
| `POST /guardians/me/institutions/{id}` | APODERADO / ADMIN | Guarda institución sin duplicarla |
| `DELETE /guardians/me/institutions/{id}` | APODERADO / ADMIN | Quita institución guardada |
| `GET /search/drivers?institutionId=...&commune=...` | APODERADO / ADMIN | Aprobados, activos, con cupos y cobertura compatible |
| `GET /pricing/estimate?institutionId=...&commune=...` | Autenticado | Estimación simulada desde PricingService |
| `POST /quotes` | APODERADO / ADMIN | Crea solicitud |
| `POST /quotes/{id}/review` | Furgonista involucrado / ADMIN | SOLICITADA → EN_REVISION |
| `POST /quotes/{id}/offer` | Furgonista involucrado / ADMIN | `{ "monthlyPrice": 78000 }`; verifica margen |
| `POST /quotes/{id}/accept` | Apoderado involucrado / ADMIN | Crea contrato y reserva cupo atómicamente |
| `POST /quotes/{id}/reject` | Parte involucrada / ADMIN | Rechaza; cancelar una solicitud sin oferta por el apoderado produce CANCELADA |
| `POST /notifications/{id}/read` | Destinatario / ADMIN | Marca leída |
| `PATCH /admin/users/{id}/active` | ADMIN | `{ "active": false }`; no permite desactivarse a sí mismo |
| `PATCH /admin/documents/{id}` | ADMIN | Estado y observación de revisión |
| `PATCH /admin/drivers/{id}` | ADMIN | Estado y motivo; aprobar exige perfil y documentos completos |

Las listas de instituciones, usuarios, documentos, cotizaciones, contratos y notificaciones se entregan mediante `/workspace`, con DTOs y alcance apropiado a cada rol. No hay un endpoint que permita crear contratos directamente ni cambiar libremente el estado de una cotización.

## Solicitar cotización

```json
{
  "driverId": "UUID_DEL_FURGONISTA",
  "institutionId": "UUID_DEL_COLEGIO",
  "address": "Los Plátanos 1234",
  "commune": "Macul"
}
```

La institución debe estar guardada por el apoderado. El backend establece fecha, estado y valor sugerido; no acepta un estimado arbitrario enviado por el cliente.

## Actualizar cobertura

```json
{
  "region": "Región Metropolitana",
  "communes": ["Macul", "Ñuñoa"],
  "institutionIds": ["UUID_DEL_COLEGIO"]
}
```

La relación explícita con instituciones evita que pertenecer a una comuna implique atender automáticamente a todos sus colegios.

## Estados HTTP

- `200`: consulta o actualización exitosa; las operaciones sin DTO devuelven cuerpo vacío.
- `201`: cotización o institución creada.
- `400`: formulario inválido, precio fuera de rango o requisitos de verificación incompletos.
- `401`: JWT ausente, inválido o vencido.
- `403`: rol, propietario, credenciales o estado de cuenta no autorizados.
- `404`: recurso inexistente o perfil no público para ese usuario.
- `409`: oferta resuelta, capacidad agotada, reducción imposible de capacidad o conflicto de integridad.

La aceptación no cobra dinero: devuelve el UUID del contrato y conserva la indicación de pago pendiente de implementación.
