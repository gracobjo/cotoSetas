import { promises as fs } from "fs";
import path from "path";
import type { StoredPermit } from "@/lib/permits";
import { ensureSchema, getSql, hasDatabase } from "@/lib/db";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "permits.json");

type StoreShape = Record<string, StoredPermit>;

async function ensureFileStore(): Promise<StoreShape> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    return {};
  }
}

async function writeFileStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function rowToPermit(data: unknown): StoredPermit {
  return data as StoredPermit;
}

/** Guarda el permiso (Postgres si hay DATABASE_URL; si no, JSON local). */
export async function persistPermit(permit: StoredPermit): Promise<void> {
  if (!hasDatabase()) {
    const store = await ensureFileStore();
    store[permit.id] = permit;
    await writeFileStore(store);
    return;
  }

  await ensureSchema();
  const sql = getSql();
  const json = JSON.stringify(permit);
  await sql`
    INSERT INTO permits (id, email, status, emitido_en, data, updated_at)
    VALUES (
      ${permit.id},
      ${permit.email},
      ${permit.status},
      ${permit.emitidoEn},
      ${json}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      status = EXCLUDED.status,
      emitido_en = EXCLUDED.emitido_en,
      data = EXCLUDED.data,
      updated_at = NOW()
  `;
}

export async function loadPermit(id: string): Promise<StoredPermit | undefined> {
  if (!hasDatabase()) {
    const store = await ensureFileStore();
    return store[id];
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT data FROM permits WHERE id = ${id} LIMIT 1`;
  if (!rows.length) return undefined;
  return rowToPermit(rows[0].data);
}

export async function loadPermitsByEmail(
  email: string
): Promise<StoredPermit[]> {
  const lower = email.trim().toLowerCase();
  if (!hasDatabase()) {
    const store = await ensureFileStore();
    return Object.values(store).filter((p) => p.email.toLowerCase() === lower);
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT data FROM permits
    WHERE lower(email) = ${lower}
    ORDER BY emitido_en DESC
  `;
  return rows.map((r) => rowToPermit(r.data));
}

export async function loadAllPermits(): Promise<StoredPermit[]> {
  if (!hasDatabase()) {
    const store = await ensureFileStore();
    return Object.values(store).sort(
      (a, b) =>
        new Date(b.emitidoEn).getTime() - new Date(a.emitidoEn).getTime()
    );
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT data FROM permits ORDER BY emitido_en DESC
  `;
  return rows.map((r) => rowToPermit(r.data));
}

export async function updatePermitStatus(
  id: string,
  status: StoredPermit["status"]
): Promise<StoredPermit | null> {
  if (!hasDatabase()) {
    const store = await ensureFileStore();
    const permit = store[id];
    if (!permit) return null;
    permit.status = status;
    store[id] = permit;
    await writeFileStore(store);
    return permit;
  }

  const existing = await loadPermit(id);
  if (!existing) return null;
  existing.status = status;
  await persistPermit(existing);
  return existing;
}
