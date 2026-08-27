import { NextResponse } from "next/server";
import { getPageContent } from "@/lib/content-store";

/** GET /api/contenido — contenido público de la landing */
export async function GET() {
  const content = await getPageContent();
  return NextResponse.json({
    ...content,
    enlaces: {
      ...content.enlaces,
      items: content.enlaces.items
        .filter((i) => i.active)
        .sort((a, b) => a.order - b.order),
    },
  });
}
