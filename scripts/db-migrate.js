/**
 * Crea el esquema en Neon y hace un smoke test.
 * Uso: npm run db:migrate
 */
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL en .env.local");
    process.exit(1);
  }

  const sql = neon(url);
  const statements = [
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

  for (const stmt of statements) {
    await sql.query(stmt);
    console.log("OK:", stmt.slice(0, 60).replace(/\s+/g, " "), "…");
  }

  const rows = await sql`SELECT current_database() AS db, now() AS ts`;
  console.log("Conectado a:", rows[0].db, "·", rows[0].ts);
  console.log("Migración completada.");
}

main().catch((err) => {
  console.error("Error de migración:", err);
  process.exit(1);
});
