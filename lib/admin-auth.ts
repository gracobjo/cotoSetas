import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Autenticación de administrador (OWASP A07 – Identification and Authentication Failures).
 * - Contraseña en env (ADMIN_PASSWORD), verificación con scrypt + timing-safe
 * - Sesión en cookie httpOnly, Secure (prod), SameSite=Lax, firmada HMAC
 */

const COOKIE = "coto_admin_session";
const MAX_AGE_SEC = 60 * 60 * 8; // 8 h

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.PERMIT_HMAC_SECRET ||
    "dev-admin-session-secret-change-me"
  );
}

function adminUser(): string {
  return (process.env.ADMIN_USER || "admin").trim();
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export type AdminSession = {
  sub: string;
  iat: number;
  exp: number;
  nonce: string;
};

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return b.toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", sessionSecret()).update(payloadB64).digest("base64url");
}

export function createSessionToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    sub: username,
    iat: now,
    exp: now + MAX_AGE_SEC,
    nonce: randomBytes(8).toString("hex"),
  };
  const payloadB64 = b64url(JSON.stringify(session));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payloadB64, mac] = token.split(".");
  if (!payloadB64 || !mac) return null;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(mac);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as AdminSession;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Verifica usuario/contraseña sin filtrar cuál falló (mensajes genéricos). */
export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const expectedUser = adminUser();
  const expectedPass = adminPassword();
  if (!expectedPass) {
    console.error("[admin] ADMIN_PASSWORD no configurada");
    return false;
  }

  const userOk =
    username.length === expectedUser.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(expectedUser));

  // Comparación de contraseña con scrypt (ralentiza fuerza bruta)
  const salt = createHmac("sha256", sessionSecret())
    .update("admin-password-salt")
    .digest();
  const hashInput = scryptSync(password, salt, 32);
  const hashExpected = scryptSync(expectedPass, salt, 32);
  const passOk = timingSafeEqual(hashInput, hashExpected);

  return userOk && passOk;
}

export function getSessionFromRequest(req: NextRequest): AdminSession | null {
  return verifySessionToken(req.cookies.get(COOKIE)?.value);
}

export function requireAdmin(req: NextRequest): AdminSession | NextResponse {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }
  return session;
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE as ADMIN_COOKIE_NAME };
