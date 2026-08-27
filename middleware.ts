import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Nombre de cookie (debe coincidir con lib/admin-auth.ts) */
const ADMIN_COOKIE = "coto_admin_session";

/**
 * Seguridad perimetral (OWASP):
 * - Cabeceras HTTP endurecidas
 * - Gate de presencia de sesión en /admin (firma HMAC se valida en APIs/Node)
 * - /documentacion: auth en app/documentacion/layout.tsx (Node, no Edge)
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.openstreetmap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get(ADMIN_COOKIE)?.value) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login);
      res.headers.forEach((v, k) => redirect.headers.set(k, v));
      return redirect;
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|especies/).*)",
  ],
};
