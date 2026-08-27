import { NextRequest, NextResponse } from "next/server";
import { listPermitsByEmail, buildVerificationUrl, encodePermitToken } from "@/lib/permits";
import { resolvePublicBaseUrl } from "@/lib/site-url";

/**
 * GET /api/permisos/recuperar?email=...
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Falta email" }, { status: 400 });
  }

  const origin = resolvePublicBaseUrl(req);
  const permits = (await listPermitsByEmail(email)).map((p) => {
    const token = encodePermitToken(p);
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
      qrDataUrl: p.qrDataUrl,
      status: p.status,
      verifyUrl: buildVerificationUrl(origin, p.id, p.firma, token),
      parque: p.parque,
    };
  });

  return NextResponse.json({ permits });
}
