import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");

export type AuditAction =
  | "compra"
  | "revocacion"
  | "verificacion"
  | "recuperacion"
  | "admin_login";

export type AuditEntry = {
  id: string;
  at: string;
  action: AuditAction;
  permitId?: string;
  codigo?: string;
  nombre?: string;
  email?: string;
  dniMask?: string;
  recolector?: string;
  modalidad?: string;
  precio?: number;
  tarifaId?: string;
  status?: string;
  ip?: string;
  detail?: string;
};

export type UsageStore = {
  /** YYYY-MM-DD → conteo */
  visitsByDay: Record<string, number>;
  verifiesByDay: Record<string, number>;
  purchasesByDay: Record<string, number>;
  pageHits: Record<string, number>;
  lastVisitAt?: string;
};

const EMPTY_USAGE: UsageStore = {
  visitsByDay: {},
  verifiesByDay: {},
  purchasesByDay: {},
  pageHits: {},
};

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

/** Añade una entrada de auditoría (compras, revocaciones, etc.). */
export async function appendAudit(
  entry: Omit<AuditEntry, "id" | "at"> & { at?: string }
): Promise<AuditEntry> {
  const list = await readJson<AuditEntry[]>(AUDIT_FILE, []);
  const full: AuditEntry = {
    id: randomUUID(),
    at: entry.at || new Date().toISOString(),
    ...entry,
  };
  list.unshift(full);
  // Conservar últimas 5000 entradas
  const trimmed = list.slice(0, 5000);
  await writeJson(AUDIT_FILE, trimmed);
  return full;
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  const list = await readJson<AuditEntry[]>(AUDIT_FILE, []);
  return list.slice(0, limit);
}

export async function loadUsage(): Promise<UsageStore> {
  return readJson<UsageStore>(USAGE_FILE, { ...EMPTY_USAGE });
}

async function saveUsage(u: UsageStore): Promise<void> {
  await writeJson(USAGE_FILE, u);
}

export async function recordVisit(pagePath: string): Promise<void> {
  const u = await loadUsage();
  const day = dayKey();
  u.visitsByDay[day] = (u.visitsByDay[day] || 0) + 1;
  const key = pagePath.slice(0, 120) || "/";
  u.pageHits[key] = (u.pageHits[key] || 0) + 1;
  u.lastVisitAt = new Date().toISOString();
  await saveUsage(u);
}

export async function recordVerify(): Promise<void> {
  const u = await loadUsage();
  const day = dayKey();
  u.verifiesByDay[day] = (u.verifiesByDay[day] || 0) + 1;
  await saveUsage(u);
}

export async function recordPurchaseDay(at = new Date()): Promise<void> {
  const u = await loadUsage();
  const day = dayKey(at);
  u.purchasesByDay[day] = (u.purchasesByDay[day] || 0) + 1;
  await saveUsage(u);
}

/** Suma valores de un mapa día→n en los últimos N días (incluye hoy). */
export function sumLastDays(
  map: Record<string, number>,
  days: number,
  from = new Date()
): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() - i);
    total += map[dayKey(d)] || 0;
  }
  return total;
}
