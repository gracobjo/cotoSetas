# Diagramas UML

**Sistema:** Villardeciervos Micología  
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
  PermitService --> StoredPermit : gestiona
  PermitService --> Tarifa : consulta
  PermitService --> DeliveryService : notifica
  ContentService --> PageContent : gestiona
  AdminSession ..> TarifasConfig : administra
  AdminSession ..> PageContent : edita CMS
  AdminSession ..> StoredPermit : audita
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

  class sesion_admin {
    sub = admin
    exp = 1724750000
  }

  permiso_ejemplo --> tarifa_gen2d : emitido con
  sesion_admin ..> permiso_ejemplo : puede revocar
```

---

## 3. Diagrama de componentes (estructural)

```mermaid
flowchart TB
  subgraph cliente[Cliente Web]
    UI[Next.js Pages / Components]
  end

  subgraph app[Aplicación Next.js]
    MW[Middleware OWASP]
    API[API Routes]
    LIB[lib dominio]
    DATA[(data/*.json)]
  end

  subgraph externos[Servicios externos]
    RESEND[Resend Email]
    TG[Telegram Bot API]
    OSM[OpenStreetMap]
    MICO[Micocyl enlaces]
  end

  UI --> MW --> API
  API --> LIB
  LIB --> DATA
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
  R --> Mostrar[Mostrar ticket]
  Compra --> Entrega[Email/Telegram]
  V --> Verificar[Verificar QR]
  A --> Login[Login]
  Login --> Tarifas[Editar tarifas]
  Login --> Auditoria[Listar/Revocar]
```

---

## 5. Diagrama de secuencia — compra y verificación (comportamiento)

```mermaid
sequenceDiagram
  actor U as Recolector
  participant Web as Web App
  participant API as API Comprar
  participant Store as Persistencia
  participant Mail as Resend/Telegram
  actor Vig as Vigilante
  participant Ver as API Verificar

  U->>Web: Completa formulario
  Web->>API: POST /api/permisos/comprar
  API->>API: Valida Zod + DNI + rate limit
  API->>Store: Guarda StoredPermit firmado
  API->>Mail: Envía comprobante
  API-->>Web: permit + QR
  Web-->>U: /mi-permiso

  Vig->>Web: Escanea QR
  Web->>Ver: GET /api/permisos/verificar
  Ver->>Store: Busca id / valida token
  Ver-->>Web: valid + datos
  Web-->>Vig: PERMISO VÁLIDO / NO VÁLIDO
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
  I --> J[Firmar y generar QR]
  J --> K[Persistir permiso]
  K --> L[Enviar notificaciones]
  L --> M[Mostrar ticket móvil]
  M --> N([Fin])
```

---

## 7. Diagrama de actividades — verificación por el vigilante

```mermaid
flowchart TD
  A([Inicio]) --> B[Escanear QR]
  B --> C[Abrir URL de verificación]
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
