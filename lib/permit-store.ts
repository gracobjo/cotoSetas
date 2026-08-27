import { promises as fs } from "fs";
import path from "path";
import type { StoredPermit } from "@/lib/permits";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "permits.json");

type StoreShape = Record<string, StoredPermit>;

async function ensureStore(): Promise<StoreShape> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    return {};
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

/** Guarda el permiso en disco (sobrevive reinicios del servidor). */
export async function persistPermit(permit: StoredPermit): Promise<void> {
  const store = await ensureStore();
  store[permit.id] = permit;
  await writeStore(store);
}

export async function loadPermit(id: string): Promise<StoredPermit | undefined> {
  const store = await ensureStore();
  return store[id];
}

export async function loadPermitsByEmail(
  email: string
): Promise<StoredPermit[]> {
  const store = await ensureStore();
  const lower = email.trim().toLowerCase();
  return Object.values(store).filter((p) => p.email.toLowerCase() === lower);
}

export async function loadAllPermits(): Promise<StoredPermit[]> {
  const store = await ensureStore();
  return Object.values(store).sort(
    (a, b) =>
      new Date(b.emitidoEn).getTime() - new Date(a.emitidoEn).getTime()
  );
}

export async function updatePermitStatus(
  id: string,
  status: StoredPermit["status"]
): Promise<StoredPermit | null> {
  const store = await ensureStore();
  const permit = store[id];
  if (!permit) return null;
  permit.status = status;
  store[id] = permit;
  await writeStore(store);
  return permit;
}
