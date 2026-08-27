# Requisitos funcionales y no funcionales

**Sistema:** Villardeciervos Micología  
**Versión del documento:** 1.2  
**Referencia de dominio:** Parque Micológico PMZA-50.001 / Micocyl Castilla y León

---

## 1. Alcance

Plataforma web para informar sobre el coto micológico de Villardeciervos y gestionar la **emisión, entrega y verificación** de permisos digitales con medidas anti-falsificación, más un **panel de administración** de tarifas, contenido, permisos, **KPIs de uso** y **auditoría de compras**.

---

## 2. Actores

| Actor | Descripción |
|-------|-------------|
| Visitante | Consulta información pública |
| Recolector | Compra y porta el permiso |
| Vigilante / SEPRONA | Verifica el QR in situ |
| Administrador | Configura tarifas, audita permisos y consulta KPIs |
| Sistema externo | Resend, Telegram, Micocyl (enlaces) |

---

## 3. Requisitos funcionales (RF)

### RF-01 Información pública
El sistema deberá mostrar introducción, regulación, especies, ruta Valparaíso, buenas prácticas, parte micológico y enlaces oficiales.

### RF-02 Tarifas
El sistema deberá listar tarifas por tipo de recolector (local, vinculado, general) y modalidad (diario, 2 días, temporada; recreativo/comercial), con precio y límite de recolección.

### RF-03 Compra de permiso
El sistema deberá permitir adquirir un permiso digital tras capturar datos del titular, validar DNI/NIE y aceptar la normativa.

### RF-04 Comprobante digital
El permiso deberá incluir identificador, código de seguridad, datos enmascarados del DNI, vigencia, límite, importe y QR de verificación.

### RF-05 Anti-falsificación
El sistema deberá firmar el permiso (HMAC-SHA256) y permitir verificación online de firma, vigencia y estado.

### RF-05b QR escaneable
El QR deberá usar una URL corta (`/v/[id]?s=`) de baja densidad, regenerable desde “Mi permiso”, para lectura fiable con la cámara del móvil.

### RF-06 Entrega por email
El sistema deberá enviar un comprobante HTML al correo del comprador cuando esté configurado el proveedor de email.

### RF-07 Entrega por Telegram
El sistema deberá enviar mensaje y QR al chat indicado cuando el bot esté configurado.

### RF-08 Visualización móvil
El titular deberá poder mostrar el permiso en el móvil (`/mi-permiso`) e imprimirlo.

### RF-09 Recuperación
El sistema deberá permitir recuperar permisos por email (con QR regenerado).

### RF-10 Alertas del parte
El usuario deberá poder activar seguimiento del primer parte de otoño (notificaciones + preferencia local + email opcional).

### RF-11 Tema visual
El sistema deberá ofrecer modo claro/oscuro.

### RF-12 Administración de tarifas
El administrador autenticado deberá poder modificar precios, límites (kg), activación y notas de campaña.

### RF-12b Administración de contenido y enlaces
El administrador deberá poder editar textos de portada e introducción (HTML sanitizado), gestionar un CRUD de enlaces oficiales (alta, baja, modificación, orden, activación) y actualizar WhatsApp/disclaimer del pie.

### RF-13 Administración de permisos
El administrador deberá listar, buscar y revocar permisos emitidos.

### RF-13b KPIs de uso
El panel de administración deberá mostrar indicadores de uso e ingresos: permisos emitidos (activos/revocados/caducados), ingresos (hoy, 7 días, 30 días, total), ticket medio, visitas web, verificaciones de QR, desglose por modalidad y recolector, y serie reciente de actividad.

### RF-13c Auditoría de compras
El sistema deberá registrar quién compra qué permiso (titular, email, DNI enmascarado, modalidad, importe, fecha/hora, código) y eventos de revocación y acceso admin, consultables y filtrables en el dashboard.

### RF-14 Documentación en línea
El sistema deberá publicar manuales y documentación técnica en `/documentacion`.

### RF-15 Disclaimer
El pie de página deberá indicar el carácter informativo y la referencia a Micocyl.

---

## 4. Requisitos no funcionales (RNF)

### RNF-01 Usabilidad
Interfaz responsive (móvil primero), navegación clara y textos en español.

### RNF-02 Seguridad (OWASP)
- Validación de entradas (Zod) y sanitización.
- Validación criptográfica de DNI/NIE.
- Rate limiting en login, compra y analytics.
- Sesión admin httpOnly + HMAC.
- Cabeceras: CSP, X-Frame-Options, nosniff, Referrer-Policy.
- No almacenar DNI en claro (hash + máscara).
- Secretos fuera del repositorio.
- Auditoría y métricas sin DNI en claro.

### RNF-03 Integridad
Alterar el QR o el payload debe invalidar la verificación.

### RNF-04 Disponibilidad (desarrollo)
Arranque local con `npm run dev`; despliegue objetivo en Vercel.

### RNF-05 Rendimiento
Páginas estáticas/SSR ligeras; imágenes locales de especies; QR generado bajo demanda en compra; beacon de analytics no bloqueante.

### RNF-06 Mantenibilidad
TypeScript estricto, componentes reutilizables, documentación de desarrollo.

### RNF-07 Portabilidad
Stack Node/Next multiplataforma (Windows/Linux/macOS).

### RNF-08 Privacidad
Minimización de datos personales; `.gitignore` de `data/` y `.env*`.

### RNF-09 Cumplimiento operativo
Límite recreativo de referencia 5 kg/persona/día; comercial configurable (20–100 kg según zona).

### RNF-10 Accesibilidad básica
Etiquetas en formularios, contraste razonable, alt en imágenes.

### RNF-11 Trazabilidad
Las compras y revocaciones deberán quedar registradas de forma persistente (append-only) para consulta administrativa.

---

## 5. Fuera de alcance (versión actual)

- Cobro real con pasarela bancaria (solo simulado).
- Base de datos multi-instancia (hoy ficheros locales).
- App nativa móvil.
- Emisión oficial vinculada jurídicamente a Micocyl (se informa y enlaza).
- Analítica de terceros (Google Analytics, etc.).
