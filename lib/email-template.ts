import QRCode from "qrcode";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { StoredPermit } from "@/lib/permits";

/**
 * Plantilla HTML del correo/comprobante estilo entrada de espectáculo.
 * Incluye QR, código de seguridad, datos del titular y validez.
 */
export function buildPermitEmailHtml(
  permit: StoredPermit,
  verifyUrl: string,
  qrDataUrl: string
): string {
  const desde = format(new Date(permit.validoDesde), "d MMM yyyy HH:mm", {
    locale: es,
  });
  const hasta = format(new Date(permit.validoHasta), "d MMM yyyy HH:mm", {
    locale: es,
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tu permiso micológico ${permit.id}</title>
</head>
<body style="margin:0;padding:0;background:#0f1f17;font-family:Georgia,serif;color:#f5f2eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1f17;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#1a3326;border-radius:12px;overflow:hidden;border:1px solid #2d5a40;">
          <tr>
            <td style="background:#c45c1a;padding:16px 24px;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">PERMISO MICOLÓGICO DIGITAL</div>
              <div style="font-size:22px;font-weight:bold;margin-top:4px;">Villardeciervos · Sierra de la Culebra</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;text-align:center;">
              <div style="font-size:13px;opacity:0.75;">Código de acceso</div>
              <div style="font-size:28px;letter-spacing:0.2em;font-weight:bold;margin:8px 0;font-family:monospace;">${permit.codigo}</div>
              <div style="font-size:12px;opacity:0.7;">ID: ${permit.id}</div>
              <img src="${qrDataUrl}" alt="QR de verificación" width="280" height="280" style="margin:20px auto;display:block;background:#fff;padding:12px;border-radius:8px;" />
              <p style="font-size:13px;opacity:0.85;margin:0;">Muestra este QR al vigilante del coto o SEPRONA</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table width="100%" style="font-size:14px;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;opacity:0.7;">Titular</td>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;text-align:right;">${permit.nombre}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;opacity:0.7;">DNI</td>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;text-align:right;font-family:monospace;">${permit.dniMask}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;opacity:0.7;">Modalidad</td>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;text-align:right;">${permit.modalidad}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;opacity:0.7;">Límite</td>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;text-align:right;">${permit.limite}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;opacity:0.7;">Válido</td>
                  <td style="padding:8px 0;border-bottom:1px solid #2d5a40;text-align:right;">${desde} → ${hasta}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;opacity:0.7;">Importe</td>
                  <td style="padding:8px 0;text-align:right;font-weight:bold;color:#e87830;">${permit.precio.toFixed(2)} €</td>
                </tr>
              </table>
              <p style="font-size:11px;opacity:0.55;margin-top:20px;line-height:1.5;">
                Documento firmado digitalmente (HMAC-SHA256). Verificación online:
                <a href="${verifyUrl}" style="color:#7dcea0;">${verifyUrl}</a><br/>
                Firma (recortada): ${permit.firma.slice(0, 32)}…
              </p>
              <p style="font-size:11px;opacity:0.45;margin-top:12px;">
                ${permit.parque} · ${permit.municipio}<br/>
                Lleva siempre este comprobante (móvil o impreso) junto a tu DNI.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function generateQrDataUrl(url: string): Promise<string> {
  // URL corta + corrección M + tamaño grande = fácil de leer con la cámara del móvil
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 3,
    width: 400,
    color: { dark: "#0f1f17", light: "#ffffff" },
  });
}
