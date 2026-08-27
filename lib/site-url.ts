import { NextRequest } from "next/server";

/**
 * URL que debe ir en el QR (accesible desde el móvil).
 * Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL si no es localhost
 * 2. Host de la petición (si compraste entrando por IP LAN)
 * 3. NEXT_PUBLIC_SITE_URL / origin (aunque sea localhost)
 */
export function resolvePublicBaseUrl(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(
    /\/$/,
    ""
  );
  const isLocal = (url: string) =>
    /localhost|127\.0\.0\.1/i.test(url) || url === "";

  if (configured && !isLocal(configured)) {
    return configured;
  }

  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "http");

  if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  if (configured) return configured;
  return req.nextUrl.origin.replace(/\/$/, "");
}
