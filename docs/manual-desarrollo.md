# Manual de desarrollo — Villardeciervos Micología

**Versión:** 1.3  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zod, Stripe

---

## 1. Estructura del proyecto

```
app/                    # Rutas App Router
  api/                  # API Routes (permisos, stripe, admin…)
  admin/                # Panel administrador
  comprar/              # Checkout (+ /exito tras Stripe)
  documentacion/        # Portal de documentación (solo admin)
  mi-permiso/           # Ticket móvil
  v/[id]/               # URL corta del QR → redirige a verificar
  verificar/[id]/       # Verificación QR
components/             # UI de secciones y shadcn
docs/                   # Fuentes markdown de documentación
lib/                    # Dominio: permisos, tarifas, stripe, auth, seguridad
data/                   # Persistencia local (gitignored)
middleware.ts           # Cabeceras OWASP + gate /admin y /documentacion
```

---

## 2. Scripts

```bash
npm run dev      # desarrollo en 0.0.0.0:3000
npm run build    # build producción
npm run start    # servir build
npm run lint     # ESLint
npm run db:migrate  # esquema Neon
```

---

## 3. Módulos clave

| Módulo | Responsabilidad |
|--------|-----------------|
| `lib/permits.ts` | Emisión, firma HMAC, URL corta QR, vigencia |
| `lib/issue-permit.ts` | Emisión compartida (compra simulado / post-Stripe) |
| `lib/stripe.ts` / `pending-orders.ts` | Checkout y pedidos pendientes |
| `lib/audit-store.ts` | Auditoría append-only + contadores de uso |
| `lib/admin-stats.ts` | Agregación de KPIs para el dashboard |
| `lib/content-store.ts` | CMS: hero, intro HTML, enlaces oficiales |
| `lib/tarifas-store.ts` | Tarifas Micocyl Zamora + guía de tipos |
| `lib/dni.ts` | Validación DNI/NIE con letra de control |
| `lib/admin-auth.ts` | Login admin, cookie httpOnly firmada |
| `lib/security.ts` | Zod + sanitización de textos |
| `lib/rate-limit.ts` | Límite de peticiones en memoria |
| `lib/email.ts` | Entrega del comprobante por email |

---

## 4. Flujo de emisión de un permiso

1. `POST /api/permisos/comprar` valida Zod + DNI + rate limit.
2. Si Stripe está activo: crea pedido pendiente + Checkout Session → el usuario paga.
3. Webhook `POST /api/stripe/webhook` o `GET /api/permisos/por-sesion` (página `/comprar/exito`) confirma el pago.
4. `issuePermit` genera ID, código, hash DNI, firma HMAC y QR corto `/v/[id]?s=`.
5. Persiste (Neon o `data/permits.json`), audita la compra y envía **email**.
6. Redirige a `/mi-permiso`.

Sin `STRIPE_SECRET_KEY` (o con `PAYMENTS_MODE=simulated`) el paso 2–3 se omiten y se emite al instante (solo desarrollo).

---

## 5. Verificar un permiso

Ruta corta del QR: `/v/[id]?s=` → redirige a `/verificar/[id]?sig=`.

API: `GET /api/permisos/verificar?id=&sig=&t=`

1. Incrementa contador de verificaciones.
2. Busca en disco/memoria/Neon.
3. Si no está, decodifica y valida el token (`?t=`) si viene en la URL.
4. Comprueba firma, vigencia y estado (`activo` / `revocado` / `caducado`).

---

## 6. KPIs y auditoría (admin)

| Endpoint | Uso |
|----------|-----|
| `GET /api/admin/stats` | KPIs + serie 7d + auditoría (requiere sesión) |
| `POST /api/analytics` | Visita de página pública (rate-limited) |
| `components/AnalyticsBeacon.tsx` | Beacon en el layout |

Eventos auditados: `compra`, `revocacion`, `admin_login` (+ métricas de visitas/verificaciones).

UI: `/admin` → pestaña **Dashboard / KPIs** (`AdminStatsPanel`).

---

## 7. Extender contenido y tarifas

### Contenido / enlaces
- Editar vía `/admin` → **Contenido / Enlaces** (recomendado).
- O modificar defaults en `lib/content-store.ts` y borrar `data/contenido.json`.

### Tarifas
- Editar vía `/admin` → **Tarifas** (precio, kg, modalidad, textos, activa).
- **Restaurar oficiales Micocyl** sustituye el catálogo por el de Zamora (general 20 € / 2 días; local/vinculado temporada).
- O modificar `DEFAULT_TARIFAS` en `lib/tarifas-store.ts` y resetear persistencia.

Tipos: `local` | `vinculado` | `general`. Campo `activa` controla la visibilidad pública. `GUIA_TIPOS_PERMISO` alimenta la guía en la landing.

---

## 8. Añadir una sección a la landing

1. Crear componente en `components/`.
2. Importarlo en `app/page.tsx`.
3. Añadir ancla en `components/Header.tsx`.

Seguir tipografía: `font-sans` (Inter) / `font-display` (Playfair) y tokens CSS de `globals.css`.

---

## 9. Seguridad al contribuir (OWASP)

- Nunca commitear `.env` / `.env.local` / `data/`.
- Validar **siempre** en servidor (no solo en cliente).
- Mensajes de error de login genéricos.
- Nuevas APIs admin: usar `requireAdmin(req)`.
- Secrets distintos por entorno.

---

## 10. Tests manuales sugeridos

1. Compra con DNI inválido → error de letra.
2. Compra válida → ticket + verificación `valid: true` + fila en auditoría.
3. Escaneo QR con cámara del móvil (URL corta).
4. Revocar en admin → verificación no válida + evento `revocacion`.
5. Login admin con rate limit (varios fallos).
6. Dashboard: KPIs de ingresos/visitas tras navegar y comprar.
7. Cambio de tarifa → se refleja en `/api/tarifas` y `/comprar`.

---

## 11. Roadmap técnico recomendado

- Persistencia en Postgres/KV (permisos + audit + usage).
- Pago Stripe/Redsys antes de firmar.
- Web Push VAPID para alertas.
- Roles admin (lectura / edición / solo KPIs).
- Tests automatizados (Playwright + Vitest).
