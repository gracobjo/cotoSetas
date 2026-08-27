import { NextRequest, NextResponse } from "next/server";
import {
  getPermit,
  decodePermitToken,
  verifySignature,
  type PermitPayload,
  type StoredPermit,
} from "@/lib/permits";
import { recordVerify } from "@/lib/audit-store";

function toPublicResponse(permit: StoredPermit, sigPrefix: string | null) {
  const payload: PermitPayload = {
    id: permit.id,
    codigo: permit.codigo,
    tarifaId: permit.tarifaId,
    recolector: permit.recolector,
    modalidad: permit.modalidad,
    precio: permit.precio,
    limite: permit.limite,
    nombre: permit.nombre,
    email: permit.email,
    dniHash: permit.dniHash,
    dniMask: permit.dniMask,
    emitidoEn: permit.emitidoEn,
    validoDesde: permit.validoDesde,
    validoHasta: permit.validoHasta,
    parque: permit.parque,
    municipio: permit.municipio,
  };

  const firmaOk = verifySignature(payload, permit.firma);
  if (!firmaOk) {
    return NextResponse.json({
      valid: false,
      error: "Firma inválida – posible falsificación",
      code: "BAD_SIGNATURE",
    });
  }

  if (sigPrefix && !permit.firma.startsWith(sigPrefix)) {
    return NextResponse.json({
      valid: false,
      error: "Código QR no coincide con la firma",
      code: "QR_MISMATCH",
    });
  }

  const now = Date.now();
  const hasta = new Date(permit.validoHasta).getTime();
  const desde = new Date(permit.validoDesde).getTime();
  const vigente =
    now >= desde && now <= hasta && permit.status === "activo";

  return NextResponse.json({
    valid: vigente && firmaOk,
    status: vigente
      ? "activo"
      : permit.status === "revocado"
        ? "revocado"
        : "caducado",
    antiForgery: {
      hmacValid: true,
      qrBound: Boolean(sigPrefix),
      securityCode: permit.codigo,
      tokenUsed: false,
    },
    permit: {
      id: permit.id,
      codigo: permit.codigo,
      nombre: permit.nombre,
      dniMask: permit.dniMask,
      recolector: permit.recolector,
      modalidad: permit.modalidad,
      limite: permit.limite,
      precio: permit.precio,
      validoDesde: permit.validoDesde,
      validoHasta: permit.validoHasta,
      parque: permit.parque,
      municipio: permit.municipio,
      emitidoEn: permit.emitidoEn,
      firmaPreview: permit.firma.slice(0, 24) + "…",
    },
  });
}

/**
 * GET /api/permisos/verificar?id=...&sig=...&t=...
 * 1) Busca en disco/memoria
 * 2) Si no hay registro, valida el token auto-contenido del QR (?t=)
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const sigPrefix = req.nextUrl.searchParams.get("sig");
  const token = req.nextUrl.searchParams.get("t");

  if (!id && !token) {
    return NextResponse.json(
      { valid: false, error: "Falta id o token" },
      { status: 400 }
    );
  }

  void recordVerify().catch(() => undefined);

  if (id) {
    const fromStore = await getPermit(id);
    if (fromStore) {
      const res = toPublicResponse(fromStore, sigPrefix);
      return res;
    }
  }

  if (token) {
    const fromToken = decodePermitToken(token);
    if (!fromToken) {
      return NextResponse.json({
        valid: false,
        error: "Token del QR inválido o manipulado",
        code: "BAD_TOKEN",
      });
    }
    if (id && fromToken.id !== id) {
      return NextResponse.json({
        valid: false,
        error: "El ID no coincide con el token del QR",
        code: "ID_MISMATCH",
      });
    }
    const res = toPublicResponse(fromToken, sigPrefix);
    // Marcar que se usó token (clone body)
    const json = await res.json();
    if (json.antiForgery) json.antiForgery.tokenUsed = true;
    return NextResponse.json(json);
  }

  return NextResponse.json({
    valid: false,
    error:
      "Permiso no encontrado. Si escaneas desde el móvil, asegúrate de que el QR se generó con tu IP LAN (no localhost) y de que el teléfono está en la misma Wi‑Fi.",
    code: "NOT_FOUND",
  });
}
