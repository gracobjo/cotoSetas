# Manual de configuración — Villardeciervos Micología

**Versión:** 1.2  
**Audiencia:** administradores del coto e IT de despliegue

---

## 1. Variables de entorno

Copia `.env.example` a `.env.local` (prioridad sobre `.env`).

### 1.1 Seguridad y URL

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `PERMIT_HMAC_SECRET` | Sí (prod) | Secreto para firmar permisos (HMAC-SHA256) |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL pública **sin** barra final. En local con móvil: `http://IP_LAN:3000` |
| `ADMIN_USER` | Sí (admin) | Usuario del panel `/admin` |
| `ADMIN_PASSWORD` | Sí (admin) | Contraseña del panel |
| `ADMIN_SESSION_SECRET` | Recomendada | Firma de la cookie de sesión admin |

### 1.2 Email (Resend)

| Variable | Descripción |
|----------|-------------|
| `EMAIL_ENABLED` | `true` / `false` |
| `RESEND_API_KEY` | Clave API de Resend |
| `EMAIL_FROM` | Remitente verificado |

Sin API key, el envío se **simula** en consola (`email:simulated`).

Con `onboarding@resend.dev` solo puedes enviar al correo de tu cuenta Resend (o verificar dominio propio).

### 1.3 Telegram

| Variable | Descripción |
|----------|-------------|
| `TELEGRAM_ENABLED` | `true` / `false` |
| `TELEGRAM_BOT_TOKEN` | Token de BotFather |
| `TELEGRAM_DEFAULT_CHAT_ID` | Chat por defecto si el usuario no indica otro |

Cómo obtener el chat ID:

1. Usuario escribe `/start` al bot.
2. Abrir `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. Copiar `chat.id`.

### 1.4 Alertas del parte

| Variable | Descripción |
|----------|-------------|
| `FORCE_PARTE_DETECTADO` | `true` fuerza detección (pruebas) |
| `MICOCYL_NEWS_URL` | URL a consultar en producción |

### 1.5 Conflicto `.env` vs `.env.local`

Si una variable está **vacía** en `.env.local`, **anula** el valor de `.env`. No dejes claves vacías si ya las rellenaste en `.env`.

---

## 2. Arranque local

```bash
npm install
cp .env.example .env.local   # y editar
npm run dev
```

El servidor escucha en `0.0.0.0:3000` (accesible por LAN).

Abrir: [http://localhost:3000](http://localhost:3000)

---

## 3. Panel administrador

URL: `/admin` → login en `/admin/login`

Pestañas:

1. **Dashboard / KPIs:** indicadores de uso e ingresos + **auditoría** de compras
   - Ingresos (hoy / 7 / 30 días / total), ticket medio
   - Permisos activos, revocados y caducados
   - Visitas web y verificaciones de QR
   - Desglose por modalidad y tipo de recolector
   - Tabla de auditoría: quién compró qué, fecha, importe, email, DNI enmascarado
   - API: `GET /api/admin/stats`
   - Persistencia de métricas: `data/usage.json`, `data/audit.json`
2. **Contenido / Enlaces:** CMS de la landing
   - Hero (títulos, descripción, imagen, CTAs)
   - Introducción (título + HTML básico sanitizado)
   - **CRUD de enlaces oficiales** (crear, editar, ordenar, activar, eliminar)
   - WhatsApp y disclaimer del footer
   - Persistencia: `data/contenido.json`
3. **Tarifas:** editar precio, kg/día, activar/desactivar, notas de campaña (`data/tarifas.json`)
4. **Permisos emitidos:** buscar, ver titular/email/DNI enmascarado, **revocar** (`data/permits.json`)

Estos ficheros **no** se suben a Git (privacidad).

---

## 4. Despliegue en Vercel

1. Importar el repo GitHub.
2. Configurar **todas** las variables de entorno en el panel de Vercel.
3. `NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app`
4. Deploy.

Persistencia: en serverless, el sistema de ficheros es efímero. Para producción real, migrar `data/` a **Postgres / Vercel KV / Supabase**.

Cron de alertas: `vercel.json` llama a `/api/alerta/check` cada hora.

---

## 5. Firewall y QR en móvil (local)

1. `NEXT_PUBLIC_SITE_URL=http://TU_IP_WIFI:3000`
2. Móvil en la misma Wi‑Fi.
3. Permitir puerto 3000 en el firewall de Windows (PowerShell **admin**):

```powershell
New-NetFirewallRule -DisplayName "cotoSetas Next.js 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

4. Emitir un permiso **nuevo** o usar **Actualizar QR** en Mi permiso (los QR antiguos con URL larga o `localhost` pueden fallar).

---

## 6. Pago real (pendiente de integración)

Hoy el cobro es simulado. Antes de firmar el permiso en producción:

1. Stripe Checkout o Redsys.
2. Emitir permiso solo tras `payment_intent.succeeded` (o equivalente).
3. Registrar el ID de pago en el permiso (y en la auditoría).

---

## 7. Checklist de puesta en marcha

- [ ] Secretos distintos en producción (`PERMIT_HMAC_SECRET`, `ADMIN_*`)
- [ ] URL pública correcta
- [ ] Resend / Telegram probados
- [ ] Admin puede entrar, ver Dashboard/KPIs y editar tarifas
- [ ] Compra de prueba + verificación QR + aparece en auditoría
- [ ] Disclaimer legal visible en footer
