/**
 * Smoke test insert/select/delete en Neon.
 * Uso: node scripts/db-smoke.js
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
  const sql = neon(process.env.DATABASE_URL);
  const id = "smoke-" + Date.now();
  const data = {
    id,
    email: "smoke@example.com",
    status: "activo",
    emitidoEn: new Date().toISOString(),
    nombre: "Smoke",
  };
  await sql`
    INSERT INTO permits (id, email, status, emitido_en, data)
    VALUES (
      ${id},
      ${data.email},
      ${data.status},
      ${data.emitidoEn},
      ${JSON.stringify(data)}::jsonb
    )
  `;
  const rows = await sql`SELECT id, email FROM permits WHERE id = ${id}`;
  console.log("insert/select OK", rows[0]);
  await sql`DELETE FROM permits WHERE id = ${id}`;
  console.log("cleanup OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
