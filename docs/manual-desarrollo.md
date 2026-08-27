# Manual de desarrollo — Villardeciervos Micología

**Versión:** 1.1  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zod

---

## 1. Estructura del proyecto

```
app/                    # Rutas App Router
  api/                  # API Routes
  admin/                # Panel administrador
  comprar/              # Checkout de permisos
  documentacion/        # Portal de documentación
  mi-permiso/           # Ticket móvil
  verificar/[id]/       # Verificación QR
components/             # UI de secciones y shadcn
docs/                   # Fuentes markdown de documentación
lib/                    # Dominio: permisos, tarifas, auth, seguridad
data/                   # Persistencia local (gitignored)
middleware.ts           # Cabeceras OWASP + gate /admin
```

---

## 2. Scripts

```bash
npm run dev      # desarrollo en 0.0.0.0:3000
npm run build    # build producción
npm run start    # servir build
npm run lint     # ESLint
```

---

## 3. Módulos clave

| Módulo | Responsabilidad |
|--------|-----------------|
| `lib/permits.ts` | Emisión, firma HMAC, token QR, vigencia |
| `lib/content-store.ts` | CMS: hero, intro HTML, enlaces oficiales |
| `lib/content-schema.ts` | Validación Zod del contenido editable |
| `lib/tarifas-store.ts` | Tarifas persistidas / defaults Micocyl |
| `lib/dni.ts` | Validación DNI/NIE con letra de control |
| `lib/admin-auth.ts` | Login admin, cookie httpOnly firmada |
| `lib/security.ts` | Zod + sanitización de textos |
| `lib/rate-limit.ts` | Límite de peticiones en memoria |
| `lib/email.ts` / `telegram.ts` | Entrega del comprobante |

---

## 4. Flujo de emisión de un permiso

1. `POST /api/permisos/comprar` valida Zod + DNI + rate limit.
2. Carga tarifa activa desde `data/tarifas.json`.
3. Genera ID, código, hash DNI, firma HMAC.
4. Construye URL de verificación con token auto-contenido (`?t=`).
5. Genera QR (PNG data URL).
6. Persiste en `data/permits.json`.
7. Envía email y/o Telegram.

---

## 5. Verificar un permiso

`GET /api/permisos/verificar?id=&sig=&t=`

1. Busca en disco/memoria.
2. Si no está, decodifica y valida el token del QR.
3. Comprueba firma, vigencia y estado (`activo` / `revocado` / `caducado`).

---

## 6. Extender contenido y tarifas

### Contenido / enlaces
- Editar vía `/admin` → **Contenido / Enlaces** (recomendado).
- O modificar defaults en `lib/content-store.ts` y borrar `data/contenido.json`.

### Tarifas
- Editar vía `/admin` → **Tarifas**, o
- Modificar `DEFAULT_TARIFAS` en `lib/tarifas-store.ts` y borrar `data/tarifas.json`.

Tipos de tarifa: `local` | `vinculado` | `general`. Campo `activa` controla la visibilidad pública.

---

## 7. Añadir una sección a la landing

1. Crear componente en `components/`.
2. Importarlo en `app/page.tsx`.
3. Añadir ancla en `components/Header.tsx`.

Seguir tipografía: `font-sans` (Inter) / `font-display` (Playfair) y tokens CSS de `globals.css`.

---

## 8. Seguridad al contribuir (OWASP)

- Nunca commitear `.env` / `.env.local` / `data/`.
- Validar **siempre** en servidor (no solo en cliente).
- Mensajes de error de login genéricos.
- Nuevas APIs admin: usar `requireAdmin(req)`.
- Secrets distintos por entorno.

---

## 9. Tests manuales sugeridos

1. Compra con DNI inválido → error de letra.
2. Compra válida → ticket + verificación `valid: true`.
3. Revocar en admin → verificación no válida.
4. Login admin con rate limit (varios fallos).
5. Cambio de tarifa → se refleja en `/api/tarifas` y `/comprar`.

---

## 10. Roadmap técnico recomendado

- Persistencia en Postgres/KV.
- Pago Stripe/Redsys antes de firmar.
- Web Push VAPID para alertas.
- Roles admin (lectura / edición).
- Tests automatizados (Playwright + Vitest).
