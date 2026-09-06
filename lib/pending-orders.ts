import { promises as fs } from "fs";
import path from "path";
import { ensureSchema, getSql, hasDatabase, kvGet, kvSet } from "@/lib/db";

/**
 * Pedidos pendientes de pago (Stripe Checkout).
 * Se crean al iniciar el checkout y se marcan fulfilled al emitir el permiso.
 */

export type PendingOrder = {
  id: string;
  tarifaId: string;
  nombre: string;
  email: string;
  /** DNI normalizado; solo en servidor hasta emitir. */
  dni: string;
  enviarEmail: boolean;
  enviarTelegram: boolean;
  telegramChatId?: string;
  precio: number;
  modalidad: string;
  recolector: string;
  createdAt: string;
  stripeSessionId?: string;
  status: "pending" | "processing" | "fulfilled" | "expired";
  permitId?: string;
  paymentIntentId?: string;
};

const KV_PREFIX = "pending_order:";
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "pending-orders.json");

type FileStore = Record<string, PendingOrder>;

async function readFileStore(): Promise<FileStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as FileStore;
  } catch {
    return {};
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function savePendingOrder(order: PendingOrder): Promise<void> {
  if (hasDatabase()) {
    await kvSet(`${KV_PREFIX}${order.id}`, order);
    if (order.stripeSessionId) {
      await kvSet(`${KV_PREFIX}session:${order.stripeSessionId}`, {
        orderId: order.id,
      });
    }
    return;
  }
  const store = await readFileStore();
  store[order.id] = order;
  await writeFileStore(store);
}

export async function getPendingOrder(
  orderId: string
): Promise<PendingOrder | null> {
  if (hasDatabase()) {
    return kvGet<PendingOrder>(`${KV_PREFIX}${orderId}`);
  }
  const store = await readFileStore();
  return store[orderId] ?? null;
}

export async function getPendingOrderBySession(
  sessionId: string
): Promise<PendingOrder | null> {
  if (hasDatabase()) {
    const ref = await kvGet<{ orderId: string }>(
      `${KV_PREFIX}session:${sessionId}`
    );
    if (!ref?.orderId) return null;
    return getPendingOrder(ref.orderId);
  }
  const store = await readFileStore();
  return (
    Object.values(store).find((o) => o.stripeSessionId === sessionId) ?? null
  );
}

/** Reserva el pedido para emitir (evita doble emisión webhook + success). */
export async function claimPendingOrder(
  orderId: string
): Promise<PendingOrder | null> {
  const order = await getPendingOrder(orderId);
  if (!order || order.status !== "pending" || !order.dni) return null;
  const claimed: PendingOrder = { ...order, status: "processing" };
  await savePendingOrder(claimed);
  return claimed;
}

export async function markOrderFulfilled(
  orderId: string,
  permitId: string,
  paymentIntentId?: string
): Promise<PendingOrder | null> {
  const order = await getPendingOrder(orderId);
  if (!order) return null;
  const updated: PendingOrder = {
    ...order,
    status: "fulfilled",
    permitId,
    paymentIntentId: paymentIntentId ?? order.paymentIntentId,
    // No conservar DNI tras emitir
    dni: "",
  };
  await savePendingOrder(updated);
  return updated;
}

/** Índice opcional por payment_intent para idempotencia. */
export async function getPermitIdByPaymentIntent(
  paymentIntentId: string
): Promise<string | null> {
  if (!paymentIntentId) return null;
  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT id FROM permits
      WHERE data->>'paymentIntentId' = ${paymentIntentId}
      LIMIT 1
    `;
    return rows[0]?.id ? String(rows[0].id) : null;
  }
  // Sin DB: se comprueba vía pending orders fulfilled
  const store = await readFileStore();
  const hit = Object.values(store).find(
    (o) => o.paymentIntentId === paymentIntentId && o.permitId
  );
  return hit?.permitId ?? null;
}
