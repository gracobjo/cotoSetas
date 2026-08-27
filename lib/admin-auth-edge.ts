/**
 * Verificación de sesión admin compatible con Edge (middleware).
 * Solo HMAC; la comprobación completa sigue en lib/admin-auth.ts (Node).
 */
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "coto_admin_session";

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.PERMIT_HMAC_SECRET ||
    "dev-admin-session-secret-change-me"
  );
}

function sign(payloadB64: string): string {
  return createHmac("sha256", sessionSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function verifySessionTokenEdge(token: string | undefined): boolean {
  if (!token) return false;
  const [payloadB64, mac] = token.split(".");
  if (!payloadB64 || !mac) return false;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(mac);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const session = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as { exp?: number };
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export { COOKIE as ADMIN_COOKIE_NAME_EDGE };
