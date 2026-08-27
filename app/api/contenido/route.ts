import { NextResponse } from "next/server";
import { getPageContent } from "@/lib/content-store";

/** Siempre leer CMS desde Neon/disco (no cachear en build de Vercel). */
export const dynamic = "force-dynamic";

/** GET /api/contenido — contenido público de la landing */
export async function GET() {
  const content = await getPageContent();
  return NextResponse.json(
    {
      ...content,
      enlaces: {
        ...content.enlaces,
        items: content.enlaces.items
          .filter((i) => i.active)
          .sort((a, b) => a.order - b.order),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
