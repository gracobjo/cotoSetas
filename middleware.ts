import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME_EDGE,
  verifySessionTokenEdge,
} from "@/lib/admin-auth-edge";

/** Nombre de cookie (debe coincidir con lib/admin-auth.ts) */
const ADMIN_COOKIE = ADMIN_COOKIE_NAME_EDGE;

/**
 * Seguridad perimetral (OWASP):
 * - Cabeceras HTTP endurecidas
 * - Gate de presencia de sesión en /admin (firma HMAC se valida en APIs/Node)
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

  if (
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    pathname.startsWith("/documentacion")
  ) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!verifySessionTokenEdge(token)) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login);
      res.headers.forEach((v, k) => redirect.headers.set(k, v));
      return redirect;
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    const authed = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.headers.forEach((v, k) => authed.headers.set(k, v));
    return authed;
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|especies/).*)",
  ],
};
