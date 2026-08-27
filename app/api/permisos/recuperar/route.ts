import { NextRequest, NextResponse } from "next/server";
import {
  listPermitsByEmail,
  buildQrVerificationUrl,
} from "@/lib/permits";
import { resolvePublicBaseUrl } from "@/lib/site-url";
import { generateQrDataUrl } from "@/lib/email-template";

/**
 * GET /api/permisos/recuperar?email=...
 * Devuelve permisos con QR regenerado (URL corta, fácil de escanear).
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Falta email" }, { status: 400 });
  }

  const origin = resolvePublicBaseUrl(req);
  const list = await listPermitsByEmail(email);

  const permits = await Promise.all(
    list.map(async (p) => {
      const verifyUrl = buildQrVerificationUrl(origin, p.id, p.firma);
      const qrDataUrl = await generateQrDataUrl(verifyUrl);
      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        dniMask: p.dniMask,
        modalidad: p.modalidad,
        precio: p.precio,
        limite: p.limite,
        validoDesde: p.validoDesde,
        validoHasta: p.validoHasta,
        emitidoEn: p.emitidoEn,
        qrDataUrl,
        status: p.status,
        verifyUrl,
        parque: p.parque,
      };
    })
  );

  return NextResponse.json({ permits });
}
