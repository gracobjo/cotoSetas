import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getTarifasConfig,
  saveTarifasConfig,
} from "@/lib/tarifas-store";
import { tarifasConfigSchema } from "@/lib/security";

/** GET /api/admin/tarifas — todas (incl. inactivas) */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const config = await getTarifasConfig();
  return NextResponse.json(config);
}

/** PUT /api/admin/tarifas — actualizar precios y parámetros */
export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = tarifasConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de tarifas inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ids = parsed.data.tarifas.map((t) => t.id);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "Hay IDs de tarifa duplicados" },
      { status: 400 }
    );
  }

  const saved = await saveTarifasConfig(
    {
      notasCampania: parsed.data.notasCampania,
      tarifas: parsed.data.tarifas,
      updatedAt: new Date().toISOString(),
    },
    auth.sub
  );

  return NextResponse.json({ ok: true, config: saved });
}
