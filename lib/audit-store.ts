import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ensureSchema, getSql, hasDatabase, kvGet, kvSet } from "@/lib/db";

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit.json");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");
const USAGE_KEY = "usage";

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

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function appendAudit(
  entry: Omit<AuditEntry, "id" | "at"> & { at?: string }
): Promise<AuditEntry> {
  const full: AuditEntry = {
    id: randomUUID(),
    at: entry.at || new Date().toISOString(),
    ...entry,
  };

  if (!hasDatabase()) {
    const list = await readJsonFile<AuditEntry[]>(AUDIT_FILE, []);
    list.unshift(full);
    await writeJsonFile(AUDIT_FILE, list.slice(0, 5000));
    return full;
  }

  await ensureSchema();
  const sql = getSql();
  const { id, at, action, ...rest } = full;
  const payload = JSON.stringify({ ...rest, action });
  await sql`
    INSERT INTO audit_log (id, at, action, payload)
    VALUES (${id}, ${at}, ${action}, ${payload}::jsonb)
  `;
  return full;
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  if (!hasDatabase()) {
    const list = await readJsonFile<AuditEntry[]>(AUDIT_FILE, []);
    return list.slice(0, limit);
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, at, action, payload
    FROM audit_log
    ORDER BY at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => {
    const payload = (r.payload || {}) as Record<string, unknown>;
    return {
      id: String(r.id),
      at: new Date(r.at as string).toISOString(),
      action: r.action as AuditAction,
      ...payload,
    } as AuditEntry;
  });
}

export async function loadUsage(): Promise<UsageStore> {
  if (!hasDatabase()) {
    return readJsonFile<UsageStore>(USAGE_FILE, { ...EMPTY_USAGE });
  }
  const stored = await kvGet<UsageStore>(USAGE_KEY);
  return stored ? { ...EMPTY_USAGE, ...stored } : { ...EMPTY_USAGE };
}

async function saveUsage(u: UsageStore): Promise<void> {
  if (!hasDatabase()) {
    await writeJsonFile(USAGE_FILE, u);
    return;
  }
  await kvSet(USAGE_KEY, u);
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
