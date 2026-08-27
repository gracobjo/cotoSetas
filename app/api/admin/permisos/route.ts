import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllPermits, revokePermit, getPermit } from "@/lib/permits";
import { appendAudit } from "@/lib/audit-store";
import { clientIp } from "@/lib/rate-limit";
import { z } from "zod";

/** GET /api/admin/permisos — listado de permisos emitidos */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  const permits = await listAllPermits();
  const filtered = q
    ? permits.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.dniMask.toLowerCase().includes(q)
      )
    : permits;

  return NextResponse.json({
    total: filtered.length,
    permits: filtered.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      email: p.email,
      dniMask: p.dniMask,
      recolector: p.recolector,
      modalidad: p.modalidad,
      precio: p.precio,
      limite: p.limite,
      status: p.status,
      emitidoEn: p.emitidoEn,
      validoDesde: p.validoDesde,
      validoHasta: p.validoHasta,
      telegramChatId: p.telegramChatId || null,
    })),
  });
}

/** PATCH /api/admin/permisos — revocar permiso { id, status: "revocado" } */
export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const schema = z.object({
    id: z.string().min(1),
    status: z.enum(["revocado", "activo"]),
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.status === "revocado") {
    const before = await getPermit(parsed.data.id);
    const updated = await revokePermit(parsed.data.id);
    if (!updated) {
      return NextResponse.json({ error: "Permiso no encontrado" }, { status: 404 });
    }
    void appendAudit({
      action: "revocacion",
      permitId: updated.id,
      codigo: updated.codigo,
      nombre: updated.nombre,
      email: updated.email,
      dniMask: updated.dniMask,
      recolector: updated.recolector,
      modalidad: updated.modalidad,
      precio: updated.precio,
      tarifaId: updated.tarifaId,
      status: "revocado",
      ip: clientIp(req),
      detail: before
        ? `Revocado por admin (antes: ${before.status})`
        : "Revocado por admin",
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, permit: { id: updated.id, status: updated.status } });
  }

  return NextResponse.json(
    { error: "Solo se permite revocar desde este endpoint" },
    { status: 400 }
  );
}
