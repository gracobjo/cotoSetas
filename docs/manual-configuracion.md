# Manual de configuración — Villardeciervos Micología

**Versión:** 1.3  
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

### 1.2 Email (Resend) — comprobante de compra

| Variable | Descripción |
|----------|-------------|
| `EMAIL_ENABLED` | `true` / `false` |
| `RESEND_API_KEY` | Clave API de Resend |
| `EMAIL_FROM` | Remitente verificado |

Sin API key, el envío se **simula** en consola (`email:simulated`).

Con `onboarding@resend.dev` solo puedes enviar al correo de tu cuenta Resend (o verificar dominio propio).

La compra pública entrega el comprobante **solo por email** (no hay opción Telegram en el formulario).

### 1.3 Alertas del parte

| Variable | Descripción |
|----------|-------------|
| `FORCE_PARTE_DETECTADO` | `true` fuerza detección (pruebas) |
| `MICOCYL_NEWS_URL` | URL a consultar en producción |

### 1.4 Conflicto `.env` vs `.env.local`

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
2. **Contenido / Enlaces:** CMS de la landing
   - Hero (títulos, descripción, imagen, CTAs)
   - Introducción (título + HTML básico sanitizado)
   - **CRUD de enlaces oficiales** (crear, editar, ordenar, activar, eliminar)
   - WhatsApp y disclaimer del footer
3. **Tarifas:** precio, kg/día, modalidad, textos de detalle, activación, notas de campaña; botón **Restaurar oficiales Micocyl** (catálogo Zamora: general 20 € / 2 días, local/vinculado temporada)
4. **Contrato / servicio:** ficha interna de gestión integral (web + soporte + alertas + admin): cliente, fechas, cuota, servicios incluidos, alcance y notas. No es pública.
5. **Permisos emitidos:** buscar, ver titular/email/DNI enmascarado, **revocar**
6. Acceso a **Documentación** (`/documentacion`) desde el panel

Con `DATABASE_URL` todo esto vive en Neon Postgres (no en ficheros locales).

---

## 4. Persistencia (Neon Postgres)

Con `DATABASE_URL` (Neon), permisos, tarifas, CMS, auditoría y KPIs se guardan en Postgres.

```bash
npm run db:migrate
```

Sin `DATABASE_URL`, se usa `data/*.json` (solo desarrollo local; no sirve en Vercel).

En Vercel: añade la misma `DATABASE_URL` (pooled) en Environment Variables.

---

## 5. Despliegue en Vercel

1. Importar el repo GitHub.
2. Configurar **todas** las variables de entorno en el panel de Vercel (incluida `DATABASE_URL`).
3. `NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app`
4. Deploy.

Cron de alertas: `vercel.json` llama a `/api/alerta/check` cada hora.

---

## 6. Firewall y QR en móvil (local)

1. `NEXT_PUBLIC_SITE_URL=http://TU_IP_WIFI:3000`
2. Móvil en la misma Wi‑Fi.
3. Permitir puerto 3000 en el firewall de Windows (PowerShell **admin**):

```powershell
New-NetFirewallRule -DisplayName "cotoSetas Next.js 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

4. Emitir un permiso **nuevo** o usar **Actualizar QR** en Mi permiso (los QR antiguos con URL larga o `localhost` pueden fallar).

---

## 7. Pagos con Stripe Checkout

### Variables

| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clave secreta (`sk_test_…` / `sk_live_…`). Si falta → **pago simulado** |
| `STRIPE_WEBHOOK_SECRET` | Secreto del endpoint `whsec_…` |
| `PAYMENTS_MODE` | `simulated` fuerza emisión sin cobro (tests) |
| `NEXT_PUBLIC_SITE_URL` | Obligatorio: success/cancel del Checkout |

### Flujo

1. `POST /api/permisos/comprar` crea un pedido pendiente y una **Checkout Session**.
2. El usuario paga en Stripe.
3. Webhook `POST /api/stripe/webhook` (`checkout.session.completed`) emite el permiso firmado.
4. `/comprar/exito?session_id=` confirma vía `GET /api/permisos/por-sesion` (fallback si el webhook tarda).

### Configurar webhook en Stripe

- URL: `https://TU_DOMINIO/api/stripe/webhook`
- Evento: `checkout.session.completed`
- Copiar el signing secret a `STRIPE_WEBHOOK_SECRET` (Vercel + local con Stripe CLI)

Local con CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

El ID de pago (`paymentIntentId` / sesión) se guarda en el permiso y en la auditoría.

---

## 8. Checklist de puesta en marcha

- [ ] Secretos distintos en producción (`PERMIT_HMAC_SECRET`, `ADMIN_*`)
- [ ] `DATABASE_URL` de Neon en local y en Vercel
- [ ] `npm run db:migrate` ejecutado
- [ ] URL pública correcta
- [ ] Resend probado (comprobante por email)
- [ ] Admin puede entrar, ver Dashboard/KPIs y editar tarifas
- [ ] Compra de prueba + verificación QR + aparece en auditoría
- [ ] Stripe: claves + webhook `checkout.session.completed` en producción
- [ ] Disclaimer legal visible en footer
