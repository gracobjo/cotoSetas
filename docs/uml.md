# Diagramas UML

**Sistema:** Villardeciervos Micología  
**Versión:** 1.2  
**Notación:** UML 2 (representación Mermaid compatible)

---

## 1. Diagrama de clases (estructural)

Muestra las principales entidades de dominio y sus relaciones.

```mermaid
classDiagram
  class Tarifa {
    +String id
    +String recolector
    +String modalidad
    +Number precio
    +Number limiteKg
    +String tipo
    +Boolean comercial
    +Boolean activa
    +Number dias
  }

  class TarifasConfig {
    +String updatedAt
    +String updatedBy
    +String notasCampania
    +Tarifa[] tarifas
  }

  class PermitPayload {
    +String id
    +String codigo
    +String tarifaId
    +String nombre
    +String email
    +String dniHash
    +String dniMask
    +String emitidoEn
    +String validoDesde
    +String validoHasta
    +Number precio
  }

  class StoredPermit {
    +String firma
    +String qrDataUrl
    +String status
    +String telegramChatId
  }

  class AuditEntry {
    +String id
    +String at
    +String action
    +String permitId
    +String nombre
    +String email
    +String dniMask
    +String modalidad
    +Number precio
  }

  class UsageStore {
    +Map visitsByDay
    +Map verifiesByDay
    +Map purchasesByDay
    +Map pageHits
  }

  class AdminStats {
    +Object kpis
    +KpiBreakdown[] byModalidad
    +AuditEntry[] audit
  }

  class AdminSession {
    +String sub
    +Number iat
    +Number exp
    +String nonce
  }

  class DeliveryService {
    +sendEmail()
    +sendTelegram()
  }

  class PermitService {
    +emit()
    +verify()
    +revoke()
  }

  class MetricsService {
    +appendAudit()
    +recordVisit()
    +computeAdminStats()
  }

  class PageContent {
    +Hero hero
    +Intro intro
    +EnlacesSection enlaces
    +Footer footer
  }

  class OfficialLink {
    +String id
    +String title
    +String description
    +String url
    +String icon
    +Number order
    +Boolean active
  }

  class ContentService {
    +getPageContent()
    +savePageContent()
  }

  TarifasConfig "1" *-- "1..*" Tarifa : contiene
  PageContent "1" *-- "0..*" OfficialLink : enlaces
  StoredPermit --|> PermitPayload : extiende
  StoredPermit --> Tarifa : tarifaId
  AuditEntry --> StoredPermit : permitId
  AdminStats o-- AuditEntry : incluye
  AdminStats o-- UsageStore : agrega
  PermitService --> StoredPermit : gestiona
  PermitService --> Tarifa : consulta
  PermitService --> DeliveryService : notifica
  PermitService --> MetricsService : audita compra/revocación
  MetricsService --> AuditEntry : persiste
  MetricsService --> UsageStore : persiste
  ContentService --> PageContent : gestiona
  AdminSession ..> TarifasConfig : administra
  AdminSession ..> PageContent : edita CMS
  AdminSession ..> StoredPermit : audita
  AdminSession ..> AdminStats : consulta KPIs
```

---

## 2. Diagrama de objetos (estructural)

Instancia ejemplo tras una compra de “2 días general”.

```mermaid
classDiagram
  class tarifa_gen2d {
    id = gen-2d
    recolector = General
    modalidad = 2 Días
    precio = 20
    limiteKg = 5
    activa = true
  }

  class permiso_ejemplo {
    id = PMZA-MTBB-ABCD
    codigo = 8AZTWU6R
    nombre = Ana Pérez
    email = ana@mail.com
    dniMask = ****5678Z
    status = activo
    precio = 20
  }

  class auditoria_compra {
    action = compra
    codigo = 8AZTWU6R
    precio = 20
    at = 2026-08-27T10:15:00Z
  }

  class sesion_admin {
    sub = admin
    exp = 1724750000
  }

  permiso_ejemplo --> tarifa_gen2d : emitido con
  auditoria_compra --> permiso_ejemplo : registra
  sesion_admin ..> permiso_ejemplo : puede revocar
  sesion_admin ..> auditoria_compra : consulta en dashboard
```

---

## 3. Diagrama de componentes (estructural)

```mermaid
flowchart TB
  subgraph cliente[Cliente Web]
    UI[Next.js Pages / Components]
    Beacon[AnalyticsBeacon]
  end

  subgraph app[Aplicación Next.js]
    MW[Middleware OWASP]
    API[API Routes]
    LIB[lib dominio]
    METRICS[audit-store / admin-stats]
    DATA[(data/*.json)]
  end

  subgraph externos[Servicios externos]
    RESEND[Resend Email]
    TG[Telegram Bot API]
    OSM[OpenStreetMap]
    MICO[Micocyl enlaces]
  end

  UI --> MW --> API
  Beacon --> API
  API --> LIB
  API --> METRICS
  LIB --> DATA
  METRICS --> DATA
  LIB --> RESEND
  LIB --> TG
  UI --> OSM
  UI --> MICO
```

---

## 4. Diagrama de casos de uso (comportamiento)

Véase también `casos-de-uso.md`. Vista condensada:

```mermaid
flowchart TB
  R((Recolector))
  V((Vigilante))
  A((Admin))

  R --> Compra[Comprar permiso]
  R --> Mostrar[Mostrar ticket / actualizar QR]
  Compra --> Entrega[Email/Telegram]
  Compra --> Audit[Registrar auditoría]
  V --> Verificar[Verificar QR corto]
  A --> Login[Login]
  Login --> KPIs[Dashboard KPIs]
  Login --> Tarifas[Editar tarifas]
  Login --> Auditoria[Listar/Revocar]
  KPIs --> Audit
```

---

## 5. Diagrama de secuencia — compra, auditoría y verificación (comportamiento)

```mermaid
sequenceDiagram
  actor U as Recolector
  participant Web as Web App
  participant API as API Comprar
  participant Store as Persistencia
  participant Audit as Audit/Usage
  participant Mail as Resend/Telegram
  actor Vig as Vigilante
  participant Ver as API Verificar
  actor Ad as Admin
  participant Stats as API Stats

  U->>Web: Completa formulario
  Web->>API: POST /api/permisos/comprar
  API->>API: Valida Zod + DNI + rate limit
  API->>Store: Guarda StoredPermit firmado
  API->>Audit: append compra + contador día
  API->>Mail: Envía comprobante
  API-->>Web: permit + QR corto
  Web-->>U: /mi-permiso

  Vig->>Web: Escanea /v/id?s=
  Web->>Ver: GET /api/permisos/verificar
  Ver->>Audit: recordVerify
  Ver->>Store: Busca id
  Ver-->>Web: valid + datos
  Web-->>Vig: PERMISO VÁLIDO / NO VÁLIDO

  Ad->>Stats: GET /api/admin/stats
  Stats->>Store: listAllPermits
  Stats->>Audit: listAudit + usage
  Stats-->>Ad: KPIs + auditoría
```

---

## 6. Diagrama de actividades — emisión de permiso (comportamiento)

```mermaid
flowchart TD
  A([Inicio]) --> B[Seleccionar tarifa]
  B --> C[Introducir datos personales]
  C --> D{DNI/NIE válido?}
  D -->|No| E[Mostrar error letra/control]
  E --> C
  D -->|Sí| F{¿Canal de entrega?}
  F -->|Ninguno| G[Error: elegir email o Telegram]
  G --> F
  F -->|OK| H[Aceptar normativa]
  H --> I[Pago simulado]
  I --> J[Firmar y generar QR corto]
  J --> K[Persistir permiso]
  K --> L[Registrar auditoría compra]
  L --> M[Enviar notificaciones]
  M --> N[Mostrar ticket móvil]
  N --> O([Fin])
```

---

## 7. Diagrama de actividades — verificación por el vigilante

```mermaid
flowchart TD
  A([Inicio]) --> B[Escanear QR corto /v/id]
  B --> C[Redirigir a /verificar]
  C --> D{¿Firma HMAC OK?}
  D -->|No| E[Posible falsificación]
  D -->|Sí| F{¿Estado activo y en fecha?}
  F -->|No| G[No válido / caducado / revocado]
  F -->|Sí| H[PERMISO VÁLIDO]
  H --> I[Contrastar DNI físico con máscara]
  E --> J([Fin])
  G --> J
  I --> J
```

---

## 8. Diagrama de actividades — consulta de KPIs (admin)

```mermaid
flowchart TD
  A([Inicio]) --> B[Login admin]
  B --> C[Abrir Dashboard / KPIs]
  C --> D[Cargar /api/admin/stats]
  D --> E[Ver ingresos, visitas, desgloses]
  E --> F[Filtrar auditoría por texto]
  F --> G{¿Abrir permiso?}
  G -->|Sí| H[Ir a /verificar/id]
  G -->|No| I([Fin])
  H --> I
```
