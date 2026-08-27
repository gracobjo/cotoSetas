import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { adminLoginSchema, sanitizeText } from "@/lib/security";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** POST /api/admin/login */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`admin-login:${ip}`, 8, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera e inténtalo de nuevo." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }

  const username = sanitizeText(parsed.data.username, 64);
  const { password } = parsed.data;

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD no está configurada en el entorno. Define credenciales en .env.local",
      },
      { status: 503 }
    );
  }

  const token = createSessionToken(username);
  const res = NextResponse.json({ ok: true, user: username });
  setSessionCookie(res, token);
  return res;
}
