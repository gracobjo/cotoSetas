import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getContrato, saveContrato } from "@/lib/contrato-store";
import { contratoGestionSchema } from "@/lib/contrato-schema";

/** GET /api/admin/contrato — ficha interna de gestión integral */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getContrato());
}

/** PUT /api/admin/contrato */
export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = contratoGestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de contrato inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const saved = await saveContrato(parsed.data, auth.sub);
  return NextResponse.json({ ok: true, contrato: saved });
}
