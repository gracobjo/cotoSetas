/**
 * Cliente Neon Postgres.
 * Si no hay DATABASE_URL, los stores usan JSON en data/ (solo local).
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getSql(): NeonQueryFunction<false, false> {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL no configurada");
  }
  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }
  return sql;
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS permits (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    emitido_en TIMESTAMPTZ NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS permits_email_idx ON permits (lower(email))`,
  `CREATE INDEX IF NOT EXISTS permits_emitido_idx ON permits (emitido_en DESC)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    at TIMESTAMPTZ NOT NULL,
    action TEXT NOT NULL,
    payload JSONB NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS audit_at_idx ON audit_log (at DESC)`,
  `CREATE TABLE IF NOT EXISTS app_kv (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

/** Crea tablas si no existen (idempotente). */
export async function ensureSchema(): Promise<void> {
  if (!hasDatabase()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = getSql();
      for (const stmt of STATEMENTS) {
        await client.query(stmt);
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  await ensureSchema();
  const client = getSql();
  const rows = await client`SELECT value FROM app_kv WHERE key = ${key} LIMIT 1`;
  if (!rows.length) return null;
  return rows[0].value as T;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  const client = getSql();
  const json = JSON.stringify(value);
  await client`
    INSERT INTO app_kv (key, value, updated_at)
    VALUES (${key}, ${json}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
