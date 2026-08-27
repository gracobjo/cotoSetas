# Villardeciervos Micología

Web profesional de micología en **Villardeciervos (Sierra de la Culebra, Zamora)** — Parque Micológico Montes del Noroeste Zamorano (`PMZA-50.001`).

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind · Shadcn/UI · Framer Motion · next-themes**.

## Funcionalidades

- Información del coto, tarifas Micocyl, especies, ruta Embalse de Valparaíso (mapa OSM), buenas prácticas y parte micológico.
- Tema claro/oscuro, animaciones, SEO y diseño responsive.
- **Sistema de alertas** del primer parte de otoño (notificaciones + localStorage + email).
- **Compraventa de permisos digitales** con:
  - Firma HMAC-SHA256 anti-falsificación
  - Código de seguridad de 8 caracteres
  - QR vinculado a `/verificar/[id]`
  - Email tipo entrada de espectáculo (Resend o simulado)
  - Pantalla móvil `/mi-permiso` para enseñar al vigilante o SEPRONA

> Disclaimer: esta web es informativa. Los permisos y partes oficiales también se gestionan en [micocyl.es](https://www.micocyl.es/). El flujo de pago de esta demo es **simulado** hasta conectar Stripe/Redsys.

## Documentación en línea

Disponible en la propia aplicación:

- Índice: `/documentacion`
- Fuentes markdown en la carpeta `docs/`

Incluye: manual de usuario, configuración, desarrollo, requisitos, casos de uso y diagramas UML.

## Panel administrador

URL: `/admin` (login en `/admin/login`)

Variables en `.env.local`:

```
ADMIN_USER=admin
ADMIN_PASSWORD=tu-password-segura
ADMIN_SESSION_SECRET=secreto-largo-aleatorio
```

Permite:
- Editar **contenido de la landing** (hero, intro HTML, footer, WhatsApp)
- **CRUD de enlaces oficiales**
- Editar precios, kg/día y activar/desactivar tarifas
- Listar permisos emitidos (titular, email, DNI enmascarado, estado)
- Revocar permisos

## Seguridad (pautas OWASP)

- Validación DNI/NIE con **letra de control** (cliente + servidor)
- Sanitización y esquemas Zod en APIs
- Rate limiting en login y compra
- Sesión admin en cookie **httpOnly** + firma HMAC
- Cabeceras: CSP, X-Frame-Options, nosniff, Referrer-Policy
- El DNI no se almacena en claro (hash + máscara)

## Verificar el QR desde el móvil

El QR apunta a `NEXT_PUBLIC_SITE_URL`. Si pone `localhost`, el teléfono **no** podrá abrirlo.

1. Averigua la IP Wi‑Fi de tu PC (`ipconfig` → IPv4).
2. En `.env` / `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=http://TU_IP_LAN:3000
   ```
3. Arranca con `npm run dev` (escucha en `0.0.0.0:3000`).
4. En el móvil (misma Wi‑Fi), abre `http://TU_IP_LAN:3000` y compra un permiso **nuevo**.
5. Escanea el QR → debe mostrar **PERMISO VÁLIDO** con titular y código.
6. Si el firewall de Windows bloquea, permite Node.js en redes privadas.

El QR incluye un token firmado (`?t=...`) y el permiso se guarda en `data/permits.json`.

## Email y Telegram

Configura el fichero `.env` (plantilla en `.env.example`):

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` / `EMAIL_FROM` | Comprobante por correo |
| `TELEGRAM_BOT_TOKEN` | Token de BotFather |
| `TELEGRAM_DEFAULT_CHAT_ID` | Chat por defecto |

En `/comprar` puedes marcar email y/o Telegram e indicar el chat_id.

Para el chat_id: `/start` a tu bot → `https://api.telegram.org/bot<TOKEN>/getUpdates`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PERMIT_HMAC_SECRET` | Secreto fuerte para firmar permisos (obligatorio en producción) |
| `NEXT_PUBLIC_SITE_URL` | URL pública (ej. `https://tu-dominio.vercel.app`) |
| `RESEND_API_KEY` | Envío real del comprobante por email |
| `EMAIL_FROM` | Remitente verificado en Resend |
| `FORCE_PARTE_DETECTADO` | `true` fuerza detección del parte (tests) |
| `MICOCYL_NEWS_URL` | URL a consultar para el scraper de partes |

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Configura las variables de entorno anteriores.
4. Deploy. El build usa `next build`.

Opcional: añade un Cron Job en Vercel apuntando a `/api/alerta/check` cada hora (ver `vercel.json`).

## Sistema de alertas real (producción)

1. **Frontend (ya incluido):** pide permiso de notificaciones, guarda preferencia en `localStorage`, comprueba periódicamente `/api/alerta/check`.
2. **Backend:** sustituye la simulación en `app/api/alerta/check/route.ts` por:
   - Fetch a noticias/API Micocyl o RSS
   - Detección de keywords (`parte`, `otoño`, `Zamora`, `PMZA`)
   - Persistencia del “último parte visto” (Vercel KV / Postgres)
3. **Cron:** Vercel Cron o [cron-job.org](https://cron-job.org) cada 1–6 h.
4. **Push / email:**
   - Web Push (VAPID) u OneSignal para navegador
   - Resend/Formspree/EmailJS para la lista de emails (hoy en `localStorage`; migra a BBDD)
5. Prueba con `FORCE_PARTE_DETECTADO=true` o el botón “Simular detección” de la UI.

### Email de alertas (Formspree / EmailJS / Resend)

En `components/AlertaParte.tsx` el email se guarda en `localStorage`. Para producción:

```ts
// Formspree
await fetch("https://formspree.io/f/TU_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
```

O crea `POST /api/subscribe` con Resend + lista en KV.

## Permisos digitales: seguridad

Cada permiso incluye:

1. **ID único** (`PMZA-…`)
2. **Código de 8 caracteres** (sin caracteres ambiguos)
3. **Hash SHA-256 del DNI** (el DNI en claro no va en el QR)
4. **Máscara de DNI** (`****5678A`) para contraste visual con el documento físico
5. **Firma HMAC-SHA256** del payload canónico
6. **QR** → `/verificar/[id]?sig=…` (prefijo de firma)

El vigilante escanea el QR o abre la URL: la API valida firma, vigencia y estado.

### Activar email real del comprobante

```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Permisos <noreply@tudominio.com>
```

Sin API key, el envío se **simula** en consola del servidor y el ticket sigue disponible en `/mi-permiso`.

### Pago real

En `app/api/permisos/comprar/route.ts`, integra Stripe Checkout o Redsys **antes** de emitir y firmar el permiso. Solo firma tras `payment_intent.succeeded` (o equivalente).

### Persistencia

El almacén actual es **en memoria** (`global.__permitStore`) — válido para demo. En producción usa:

- Vercel Postgres / Neon
- Vercel KV
- Supabase

## Estructura

```
app/
  page.tsx                 # Landing
  comprar/                 # Checkout de permisos
  mi-permiso/              # Ticket móvil
  verificar/[id]/          # Verificación (vigilantes/SEPRONA)
  api/permisos/...
  api/alerta/check/
components/                # Hero, Tarifas, Especies, AlertaParte, etc.
lib/                       # content, permits, email
public/                    # Sustituye imágenes placeholder
```

## Imágenes

Las fotos usan Unsplash como placeholder. Sustituye por fotos propias de la Sierra de la Culebra en `public/` y actualiza las rutas en `lib/content.ts` y `components/Hero.tsx`.

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # producción
npm run start    # servir build
npm run lint     # ESLint
```
