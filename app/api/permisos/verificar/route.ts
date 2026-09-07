import { NextRequest, NextResponse } from "next/server";
import {
  getPermit,
  decodePermitToken,
  verifySignature,
  type PermitPayload,
  type StoredPermit,
} from "@/lib/permits";
import { recordVerify } from "@/lib/audit-store";

function jsonNoStore(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
    },
  });
}

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
    return jsonNoStore({
      valid: false,
      error: "Firma inválida – posible falsificación",
      code: "BAD_SIGNATURE",
    });
  }

  if (sigPrefix && !permit.firma.startsWith(sigPrefix)) {
    return jsonNoStore({
      valid: false,
      error: "Código QR no coincide con la firma",
      code: "QR_MISMATCH",
    });
  }

  const now = Date.now();
  const hasta = new Date(permit.validoHasta).getTime();
  const desde = new Date(permit.validoDesde).getTime();
  const noRevocado = permit.status === "activo";
  const enPlazo = now >= desde && now <= hasta;
  const vigente = enPlazo && noRevocado;

  let status: string;
  if (permit.status === "revocado") status = "revocado";
  else if (!enPlazo) status = "caducado";
  else status = "activo";

  return jsonNoStore({
    valid: vigente && firmaOk,
    status,
    checkedAt: new Date().toISOString(),
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
      status: permit.status,
      firmaPreview: permit.firma.slice(0, 24) + "…",
    },
  });
}

/**
 * GET /api/permisos/verificar?id=...&sig=...&t=...
 * El estado en servidor (p. ej. revocado) prevalece siempre sobre el token del QR.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const sigPrefix = req.nextUrl.searchParams.get("sig");
  const token = req.nextUrl.searchParams.get("t");

  if (!id && !token) {
    return jsonNoStore(
      { valid: false, error: "Falta id o token" },
      { status: 400 }
    );
  }

  void recordVerify().catch(() => undefined);

  if (id) {
    const fromStore = await getPermit(id);
    if (fromStore) {
      return toPublicResponse(fromStore, sigPrefix);
    }
  }

  if (token) {
    const fromToken = decodePermitToken(token);
    if (!fromToken) {
      return jsonNoStore({
        valid: false,
        error: "Token del QR inválido o manipulado",
        code: "BAD_TOKEN",
      });
    }
    if (id && fromToken.id !== id) {
      return jsonNoStore({
        valid: false,
        error: "El ID no coincide con el token del QR",
        code: "ID_MISMATCH",
      });
    }

    const fromStoreByToken = await getPermit(fromToken.id);
    if (fromStoreByToken) {
      return toPublicResponse(fromStoreByToken, sigPrefix);
    }

    const res = toPublicResponse(fromToken, sigPrefix);
    const json = await res.json();
    if (json.antiForgery) json.antiForgery.tokenUsed = true;
    return jsonNoStore(json);
  }

  return jsonNoStore({
    valid: false,
    error:
      "Permiso no encontrado. Si escaneas desde el móvil, asegúrate de que el QR se generó con tu IP LAN (no localhost) y de que el teléfono está en la misma Wi‑Fi.",
    code: "NOT_FOUND",
  });
}
