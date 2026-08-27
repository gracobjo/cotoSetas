import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordVisit } from "@/lib/audit-store";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  path: z.string().min(1).max(120),
});

/**
 * POST /api/analytics — registra visita de página (público, rate-limited).
 * Body: { path: "/comprar" }
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`analytics:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "path inválido" }, { status: 400 });
  }

  // Ignorar rutas admin / APIs
  const p = parsed.data.path;
  if (p.startsWith("/admin") || p.startsWith("/api")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await recordVisit(p);
  return NextResponse.json({ ok: true });
}
