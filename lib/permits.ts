import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { Tarifa } from "@/lib/tarifas-store";
import {
  loadPermit,
  loadPermitsByEmail,
  loadAllPermits,
  persistPermit,
  updatePermitStatus,
} from "@/lib/permit-store";

/**
 * Seguridad del permiso digital:
 * - ID único + código de 8 caracteres
 * - Firma HMAC-SHA256 (anti-falsificación)
 * - QR con token auto-contenido (?t=...) para verificar sin depender solo de memoria
 * - Persistencia en data/permits.json
 */

const SECRET =
  process.env.PERMIT_HMAC_SECRET ||
  "coto-setas-dev-secret-cambiar-en-produccion-2026";

export type PermitPayload = {
  id: string;
  codigo: string;
  tarifaId: string;
  recolector: string;
  modalidad: string;
  precio: number;
  limite: string;
  nombre: string;
  email: string;
  dniHash: string;
  dniMask: string;
  emitidoEn: string;
  validoDesde: string;
  validoHasta: string;
  parque: string;
  municipio: string;
};

export type StoredPermit = PermitPayload & {
  firma: string;
  qrDataUrl?: string;
  status: "activo" | "revocado" | "caducado";
  telegramChatId?: string;
};

/** Enmascarar DNI: 12345678A → ****5678A */
export function maskDni(dni: string): string {
  const clean = dni.trim().toUpperCase();
  if (clean.length < 4) return "****";
  return "*".repeat(Math.max(0, clean.length - 4)) + clean.slice(-4);
}

/** Hash SHA-256 del DNI normalizado */
export async function hashDni(dni: string): Promise<string> {
  const normalized = dni.trim().toUpperCase().replace(/[\s-]/g, "");
  const { createHash } = await import("crypto");
  return createHash("sha256").update(normalized + SECRET).digest("hex");
}

export function generatePermitId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `PMZA-${stamp}-${rand}`;
}

export function generateSecurityCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

export function canonicalPayload(p: PermitPayload): string {
  return [
    p.id,
    p.codigo,
    p.tarifaId,
    p.nombre,
    p.email,
    p.dniHash,
    p.emitidoEn,
    p.validoDesde,
    p.validoHasta,
    p.precio.toFixed(2),
    p.parque,
  ].join("|");
}

export function signPayload(p: PermitPayload): string {
  return createHmac("sha256", SECRET)
    .update(canonicalPayload(p))
    .digest("hex");
}

export function verifySignature(p: PermitPayload, firma: string): boolean {
  const expected = signPayload(p);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(firma, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Token compacto firmado para el QR (verificación auto-contenida). */
export function encodePermitToken(permit: StoredPermit): string {
  const body = {
    id: permit.id,
    codigo: permit.codigo,
    tarifaId: permit.tarifaId,
    recolector: permit.recolector,
    modalidad: permit.modalidad,
    precio: permit.precio,
    limite: permit.limite,
    nombre: permit.nombre,
    email: permit.email,
    dniHash: permit.dniHash,
    dniMask: permit.dniMask,
    emitidoEn: permit.emitidoEn,
    validoDesde: permit.validoDesde,
    validoHasta: permit.validoHasta,
    parque: permit.parque,
    municipio: permit.municipio,
    status: permit.status,
    firma: permit.firma,
  };
  const json = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const mac = createHmac("sha256", SECRET).update(json).digest("base64url");
  return `${json}.${mac}`;
}

export function decodePermitToken(token: string): StoredPermit | null {
  const [json, mac] = token.split(".");
  if (!json || !mac) return null;
  const expected = createHmac("sha256", SECRET)
    .update(json)
    .digest("base64url");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(mac);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const body = JSON.parse(
      Buffer.from(json, "base64url").toString("utf8")
    ) as StoredPermit;
    const payload: PermitPayload = {
      id: body.id,
      codigo: body.codigo,
      tarifaId: body.tarifaId,
      recolector: body.recolector,
      modalidad: body.modalidad,
      precio: body.precio,
      limite: body.limite,
      nombre: body.nombre,
      email: body.email,
      dniHash: body.dniHash,
      dniMask: body.dniMask,
      emitidoEn: body.emitidoEn,
      validoDesde: body.validoDesde,
      validoHasta: body.validoHasta,
      parque: body.parque,
      municipio: body.municipio,
    };
    if (!verifySignature(payload, body.firma)) return null;
    return {
      ...payload,
      firma: body.firma,
      status: body.status || "activo",
      qrDataUrl: body.qrDataUrl,
    };
  } catch {
    return null;
  }
}

export function buildVerificationUrl(
  baseUrl: string,
  id: string,
  firma: string,
  token?: string
): string {
  // URL corta para QR legible en móvil (sin token largo).
  // El token completo solo se añade si se pide explícitamente (enlaces de respaldo).
  const short = `${baseUrl.replace(/\/$/, "")}/v/${encodeURIComponent(id)}?s=${firma.slice(0, 16)}`;
  if (!token) return short;
  return `${short}&t=${encodeURIComponent(token)}`;
}

/** URL corta exclusiva para el QR (fácil de escanear). */
export function buildQrVerificationUrl(
  baseUrl: string,
  id: string,
  firma: string
): string {
  return `${baseUrl.replace(/\/$/, "")}/v/${encodeURIComponent(id)}?s=${firma.slice(0, 16)}`;
}

export function computeValidity(
  tarifa: Tarifa,
  from = new Date()
): { validoDesde: string; validoHasta: string } {
  const desde = new Date(from);
  const hasta = new Date(from);

  if (tarifa.dias) {
    hasta.setDate(hasta.getDate() + tarifa.dias);
  } else {
    const year =
      desde.getMonth() >= 11 && desde.getDate() > 15
        ? desde.getFullYear() + 1
        : desde.getFullYear();
    hasta.setFullYear(year, 11, 31);
    hasta.setHours(23, 59, 59, 999);
  }

  return {
    validoDesde: desde.toISOString(),
    validoHasta: hasta.toISOString(),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __permitStore: Map<string, StoredPermit> | undefined;
}

export function getPermitStore(): Map<string, StoredPermit> {
  if (!global.__permitStore) {
    global.__permitStore = new Map();
  }
  return global.__permitStore;
}

export async function savePermit(permit: StoredPermit): Promise<void> {
  getPermitStore().set(permit.id, permit);
  await persistPermit(permit);
}

export async function getPermit(id: string): Promise<StoredPermit | undefined> {
  const mem = getPermitStore().get(id);
  if (mem) return mem;
  const disk = await loadPermit(id);
  if (disk) getPermitStore().set(id, disk);
  return disk;
}

export async function listPermitsByEmail(
  email: string
): Promise<StoredPermit[]> {
  const fromDisk = await loadPermitsByEmail(email);
  for (const p of fromDisk) getPermitStore().set(p.id, p);
  return fromDisk;
}

export async function listAllPermits(): Promise<StoredPermit[]> {
  const fromDisk = await loadAllPermits();
  for (const p of fromDisk) getPermitStore().set(p.id, p);
  return fromDisk;
}

export async function revokePermit(id: string): Promise<StoredPermit | null> {
  const updated = await updatePermitStatus(id, "revocado");
  if (updated) getPermitStore().set(id, updated);
  return updated;
}
