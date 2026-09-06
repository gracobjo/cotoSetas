import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Nombre de cookie (debe coincidir con lib/admin-auth.ts) */
const ADMIN_COOKIE = "coto_admin_session";

/**
 * Seguridad perimetral (OWASP):
 * - Cabeceras HTTP endurecidas
 * - Gate de presencia de sesión en /admin (firma HMAC se valida en APIs/Node)
 * - /documentacion: gate de cookie en Edge + HMAC en layout (Node)
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

  const sessionCookie = req.cookies.get(ADMIN_COOKIE)?.value;

  if (pathname.startsWith("/documentacion")) {
    if (!sessionCookie) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login, 307);
      res.headers.forEach((v, k) => redirect.headers.set(k, v));
      redirect.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, max-age=0, must-revalidate"
      );
      return redirect;
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!sessionCookie) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login, 307);
      res.headers.forEach((v, k) => redirect.headers.set(k, v));
      return redirect;
    }
  }

  if (pathname.startsWith("/documentacion")) {
    res.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate"
    );
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|especies/).*)",
  ],
};
