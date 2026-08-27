# Manual de usuario — Villardeciervos Micología

**Versión:** 1.2  
**Audiencia:** recolectores, visitantes y personal de vigilancia del coto  
**Sitio:** web informativa y de permisos digitales del Parque Micológico Montes del Noroeste Zamorano (PMZA-50.001)

---

## 1. ¿Qué es esta aplicación?

Es una plataforma web para:

- Consultar información micológica de Villardeciervos (Sierra de la Culebra, Zamora).
- Conocer tarifas, especies, rutas y el estado del parte micológico.
- **Comprar un permiso digital** con QR verificable (email y/o Telegram).
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

---

## 3. Navegación principal

En la cabecera encontrarás:

| Sección | Contenido |
|---------|-----------|
| Inicio | Presentación y accesos rápidos |
| Permisos | Tabla de tarifas y compra |
| Especies | Boletus, níscalos, cucurriles, chantarelas |
| Rutas | Embalse de Valparaíso + mapa |
| Parte Micológico | Estado actual y cuenta atrás |
| Alertas | Aviso del primer parte de otoño |
| Docs | Manuales, requisitos y UML (`/documentacion`) |
| Contacto | Enlaces y pie de página |

También: **tema claro/oscuro**, botón WhatsApp flotante y documentación en línea.

Los textos de portada, introducción y **enlaces oficiales** los puede actualizar el administrador del coto sin tocar código.

---

## 4. Consultar tarifas

1. Ve a **Permisos** (o `#permisos`).
2. Filtra por **Local**, **Vinculado** o **General**.
3. Revisa precio, modalidad y límite de kg/día.
4. Pulsa **Comprar** en la tarifa deseada.

Los precios los puede actualizar el administrador del coto.

---

## 5. Comprar un permiso digital

1. Entra en **Comprar permiso** (`/comprar`).
2. Elige la **modalidad**.
3. Rellena:
   - Nombre completo  
   - Email  
   - DNI/NIE (se valida la letra; ej. `12345678Z`)  
4. Elige entrega: **email** y/o **Telegram** (chat ID).
5. Acepta la normativa del coto.
6. Confirma el pago (en la versión actual el cobro es **simulado**).
7. Se genera el permiso con:
   - Código de 8 caracteres  
   - QR de verificación (URL corta `/v/[id]`, fácil de escanear)  
   - Firma digital anti-falsificación  

### Tras la compra

- Se muestra el ticket en **Mi permiso** (`/mi-permiso`).
- Puedes **imprimir / guardar** o abrir la verificación.
- Si activaste email/Telegram, recibirás el comprobante (estilo entrada).

---

## 6. Mostrar el permiso al vigilante o SEPRONA

1. Abre `/mi-permiso` en el móvil (o el mensaje de Telegram/email).
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
| No llega Telegram | Debes haber hecho `/start` al bot; chat ID correcto |
| El QR no se lee / no abre | Actualiza el QR en Mi permiso; en local usa IP LAN y abre el puerto en el firewall |
| Permiso “no encontrado” | Emite uno nuevo tras reiniciar/configurar bien la URL pública |

---

## 10. Buenas prácticas en el campo

- Llevar permiso (digital o impreso) + DNI.
- Cesta de mimbre (prohibidas bolsas de plástico).
- No usar rastrillos; corte limpio por la base.
- Respetar el límite de kg de tu modalidad.
