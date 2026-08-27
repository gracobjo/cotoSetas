import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getPageContent, savePageContent } from "@/lib/content-store";
import { pageContentSchema } from "@/lib/content-schema";

/** GET /api/admin/contenido */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getPageContent());
}

/** PUT /api/admin/contenido */
export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = pageContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contenido inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ids = parsed.data.enlaces.items.map((i) => i.id);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "Hay IDs de enlace duplicados" },
      { status: 400 }
    );
  }

  const saved = await savePageContent(
    {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    },
    auth.sub
  );

  return NextResponse.json({ ok: true, content: saved });
}
