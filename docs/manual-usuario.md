# Manual de usuario — Villardeciervos Micología

**Versión:** 1.3  
**Audiencia:** recolectores, visitantes y personal de vigilancia del coto  
**Sitio:** web informativa y de permisos digitales del Parque Micológico Montes del Noroeste Zamorano (PMZA-50.001)

---

## 1. ¿Qué es esta aplicación?

Es una plataforma web para:

- Consultar información micológica de Villardeciervos (Sierra de la Culebra, Zamora).
- Conocer tarifas, especies, rutas y el estado del parte micológico.
- **Comprar un permiso digital** con QR verificable (pago con Stripe; comprobante por email).
- Activar alertas del primer parte de otoño.
- Que vigilantes o SEPRONA **verifiquen** la autenticidad del permiso escaneando el QR.

> Esta web es informativa. Los permisos oficiales también se gestionan en [micocyl.es](https://www.micocyl.es/).

---

## 2. Requisitos para usarla

| Requisito | Detalle |
|-----------|---------|
| Navegador | Chrome, Firefox, Edge o Safari actualizados |
| Conexión | Internet (obligatoria para comprar y verificar) |
| Móvil | Misma Wi‑Fi que el PC si pruebas en local; en producción, dominio público |
| Documentación | DNI/NIE válido (con letra de control correcta) |
| Pago | Tarjeta (Stripe Checkout) cuando el cobro esté activo |

---

## 3. Navegación principal

En la cabecera encontrarás:

| Sección | Contenido |
|---------|-----------|
| Inicio | Presentación y accesos rápidos |
| Permisos | Guía de tipos + tabla de tarifas y compra |
| Especies | Boletus, níscalos, cucurriles, chantarelas |
| Rutas | Embalse de Valparaíso + mapa |
| Parte Micológico | Estado actual y cuenta atrás |
| Alertas | Aviso del primer parte de otoño |
| Contacto | Enlaces y pie de página |

También: **tema claro/oscuro** y botón WhatsApp flotante.

Los textos de portada, introducción y **enlaces oficiales** los puede actualizar el administrador del coto sin tocar código. La documentación técnica (`/documentacion`) es solo para administradores.

---

## 4. Consultar tarifas

1. Ve a **Permisos** (o `#permisos`).
2. Lee la **guía de tipos**: general, local, vinculado; recreativo vs comercial; duración (2 días / temporada).
3. Filtra por **Local**, **Vinculado** o **General**.
4. Revisa precio, modalidad, límite de kg/día y el detalle de cada tarifa.
5. Pulsa **Comprar** en la tarifa deseada.

### Diferencias importantes (Zamora / Micocyl)

| Tipo | Quién | Qué suele incluir |
|------|--------|-------------------|
| **General** | Visitante sin empadronamiento ni vínculo | **2 días consecutivos** recreativo (no hay permiso general de 1 día en este parque) |
| **Local** | Empadronado en municipio del acotado | Temporada (recreativo o comercial), tarifa bonificada |
| **Vinculado** | Propiedad, nacimiento o familiar de 1.er grado | Temporada a precio intermedio |
| **Recreativo** | Consumo propio | Hasta ~5 kg/persona/día |
| **Comercial** | Aprovechamiento comercial | Cupo mayor (hasta 100 kg/día según normativa) |

Los precios y textos los puede actualizar el administrador del coto.

---

## 5. Comprar un permiso digital

1. Entra en **Comprar permiso** (`/comprar`).
2. Elige la **modalidad**.
3. Rellena:
   - Nombre completo  
   - Email (aquí recibirás el comprobante con QR)  
   - DNI/NIE (se valida la letra; ej. `12345678Z`)  
4. Acepta la normativa del coto.
5. Confirma el pago:
   - Con Stripe configurado → Checkout seguro con tarjeta.
   - Sin Stripe (solo desarrollo) → emisión simulada inmediata.
6. Tras el cobro se genera el permiso con:
   - Código de 8 caracteres  
   - QR de verificación (URL corta `/v/[id]`, fácil de escanear)  
   - Firma digital anti-falsificación  

### Tras la compra

- Se muestra el ticket en **Mi permiso** (`/mi-permiso`).
- Puedes **imprimir / guardar** o abrir la verificación.
- Recibirás el comprobante por **email** (estilo entrada).

---

## 6. Mostrar el permiso al vigilante o SEPRONA

1. Abre `/mi-permiso` en el móvil (o el email del comprobante).
2. Enseña el **QR** junto al **DNI físico**.
3. El vigilante escanea el QR → página **PERMISO VÁLIDO** (o aviso si está caducado/revocado/falsificado).

El QR apunta a una URL corta firmada (`/v/...`); no es solo una imagen decorativa.

### Si el móvil no lee el QR

1. En **Mi permiso**, usa **Actualizar QR** con el email de compra (regenera un código más grande y corto).
2. Comprueba que el teléfono está en la misma Wi‑Fi y que la web no usa `localhost` en el enlace.

---

## 7. Recuperar un permiso

Si cambias de dispositivo:

1. Ve a **Mi permiso**.
2. Introduce el **email** usado en la compra.
3. Se recuperan los permisos asociados (en el servidor) con QR regenerado.

También puedes usar el ticket guardado en el propio móvil (almacenamiento local).

---

## 8. Alertas del primer parte de otoño

1. Sección **Alertas**.
2. Activa el seguimiento (permite notificaciones del navegador).
3. Opcionalmente, deja tu email.
4. Puedes **comprobar ahora** o simular detección (demo).

Cuando haya parte, verás un banner y, si diste permiso, una notificación.

---

## 9. Problemas frecuentes

| Problema | Qué hacer |
|----------|-----------|
| DNI rechazado | Comprueba la letra de control (algoritmo oficial español) |
| No llega el email | Revisa spam; con `onboarding@resend.dev` solo llega al email de la cuenta Resend |
| El pago no termina | Vuelve a `/comprar`; si cancelaste en Stripe no se ha cobrado ni emitido permiso |
| El QR no se lee / no abre | Actualiza el QR en Mi permiso; en local usa IP LAN y abre el puerto en el firewall |
| Permiso “no encontrado” | Emite uno nuevo tras reiniciar/configurar bien la URL pública |

---

## 10. Buenas prácticas en el campo

Lleva siempre permiso + DNI, cesta de mimbre (sin bolsas de plástico), no uses rastrillos y respeta el límite de capturas de tu modalidad.
