# Arquitectura, datos y diagramas del prototipo

Modelo derivado del código local al 21 de octubre de 2026. Los diagramas omiten atributos auxiliares para ser legibles; las migraciones Flyway y las clases son la fuente completa. V3 y V4 pertenecen a la ampliación local pendiente de publicar junto con su código.

## Componentes y despliegue lógico

```mermaid
flowchart LR
    U[Apoderado / conductor / colegio / administrador] --> WEB[Next.js + React + TypeScript]
    WEB -->|HTTP REST y JWT| API[Spring Boot]
    WEB --> MAPS[Google Maps / Places]
    API --> AUTH[Autenticación y autorización]
    API --> DOMAIN[Instituciones / conductores / cotizaciones]
    DOMAIN --> JPA[JPA / Hibernate]
    JPA --> DB[(H2 local / PostgreSQL objetivo)]
    FLY[Flyway] --> DB
```

La API concentra reglas de negocio y persistencia. El mapa ayuda a seleccionar ubicaciones; la API vuelve a validar territorio y disponibilidad, porque los controles del navegador no son una frontera de seguridad. El navegador recibe una clave de Maps destinada al navegador; sus restricciones de origen y APIs se configuran en Google Cloud.

## Casos de uso

```mermaid
flowchart LR
    A[Apoderado] --> B[Buscar institución y punto de recogida]
    A --> C[Solicitar cotización]
    A --> D[Aceptar oferta / consultar contrato]
    F[Furgonista] --> E[Configurar perfil, vehículo y documentos]
    F --> T[Delimitar territorio y seleccionar instituciones]
    F --> O[Responder cotización]
    K[Colegio] --> I[Registrar institución con ubicación]
    M[Administrador] --> R[Revisar documentos y aprobar]
    B --> V[Comprobar cobertura y cupos]
    D --> V
```

Precondición de búsqueda: institución existente y punto de recogida definido para conductores con territorio. Precondición de oferta/aceptación: identidad y propiedad válidas. Si falta aprobación, se agotaron cupos o cambió la cobertura, la operación debe rechazarse sin crear un contrato parcial.

## Modelo entidad-relación resumido

```mermaid
erDiagram
    app_user ||--o| driver_profile : tiene
    app_user ||--o| institution : administra
    driver_profile ||--o| vehicle : usa
    driver_profile ||--o{ driver_document : entrega
    driver_profile ||--o{ coverage_area : cobertura_legacy
    driver_profile ||--o{ driver_territory_point : delimita
    driver_profile ||--o{ driver_institution : atiende
    institution ||--o{ driver_institution : recibe
    app_user ||--o{ guardian_institution : guarda
    institution ||--o{ guardian_institution : seleccionada
    app_user ||--o{ quote : solicita
    driver_profile ||--o{ quote : recibe
    institution ||--o{ quote : destino
    quote ||--o| transport_contract : origina
    vehicle ||--o{ transport_contract : reserva
    app_user ||--o{ notification : recibe
    quote ||--o{ notification : informa
    app_user ||--o{ media_asset : carga
```

Reglas físicas: email y patente únicos; un perfil conductor por usuario; un vehículo por perfil; un contrato por cotización; pares conductor/institución y apoderado/institución únicos. Los puntos territoriales se ordenan por `(driver_id, point_order)` y guardan latitud/longitud. La capacidad se limita a 1–60. La aceptación compara contratos activos y capacidad bajo transacción; una restricción estática por sí sola no representa la disponibilidad dinámica.

## Clases de dominio resumidas

```mermaid
classDiagram
    class User {
      UUID id
      String email
      Role role
      boolean active
    }
    class DriverProfile {
      UUID id
      DriverStatus status
    }
    class Vehicle {
      String plate
      int capacity
    }
    class Institution {
      String name
      String address
      Double latitude
      Double longitude
    }
    class Quote {
      QuoteStatus status
      BigDecimal offeredPrice
    }
    class TransportContract {
      ContractStatus status
    }
    User "1" --> "0..1" DriverProfile
    DriverProfile "1" --> "0..1" Vehicle
    DriverProfile "*" --> "*" Institution : atiende
    Quote --> Institution
    Quote --> DriverProfile
    Quote "1" --> "0..1" TransportContract
```

Los nombres de atributos del diagrama son conceptuales abreviados. No pretende ser una copia exhaustiva de anotaciones JPA ni de todos los campos SQL.

## Secuencia de aceptación

```mermaid
sequenceDiagram
    actor A as Apoderado
    participant UI as Frontend
    participant API as QuoteController
    participant S as QuoteService
    participant DB as Base de datos
    A->>UI: Aceptar oferta
    UI->>API: Solicitud autenticada
    API->>S: Validar operación
    S->>DB: Iniciar transacción y bloquear registros
    DB-->>S: Cotización, conductor y vehículo
    S->>S: Validar propietario, estado, aprobación y cobertura
    S->>DB: Consultar contratos activos y capacidad
    alt Hay disponibilidad y datos válidos
      S->>DB: Crear contrato, actualizar estado y notificar
      DB-->>S: Confirmar transacción
      S-->>UI: Contrato
    else Operación inválida o sin cupos
      S-->>UI: Error sin nueva reserva
    end
```

## Decisiones y consecuencias

Se eligió monolito modular para mantener transacciones y permisos en un solo servicio durante el prototipo. JPA y Flyway separan el acceso a datos de la evolución del esquema. H2 reduce requisitos de la demostración, pero no reemplaza la prueba del motor PostgreSQL. Los polígonos representan recogida con mayor precisión que una comuna; requieren validar geometría y coordinar cambios de API, persistencia y navegador. Las pruebas simuladas de Maps no comprueban autorización real de la API ni todos los estados de carga del mapa.
