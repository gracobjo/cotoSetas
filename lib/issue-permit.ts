import { NextRequest } from "next/server";
import { SITE } from "@/lib/content";
import { getTarifaById } from "@/lib/tarifas-store";
import {
  computeValidity,
  generatePermitId,
  generateSecurityCode,
  hashDni,
  maskDni,
  savePermit,
  signPayload,
  buildQrVerificationUrl,
  type PermitPayload,
  type StoredPermit,
} from "@/lib/permits";
import { generateQrDataUrl } from "@/lib/email-template";
import { sendPermitEmail } from "@/lib/email";
import { sendPermitTelegram } from "@/lib/telegram";
import { resolvePublicBaseUrl } from "@/lib/site-url";
import { appendAudit, recordPurchaseDay } from "@/lib/audit-store";
import { clientIp } from "@/lib/rate-limit";
import type { PendingOrder } from "@/lib/pending-orders";

export type IssuePermitInput = {
  tarifaId: string;
  nombre: string;
  email: string;
  dniClean: string;
  enviarEmail: boolean;
  enviarTelegram: boolean;
  telegramChatId?: string;
  /** Origen de la petición (para base URL del QR). */
  req?: NextRequest;
  /** Base URL forzada (p. ej. desde webhook). */
  baseUrlOverride?: string;
  payment?: {
    provider: "stripe" | "simulated";
    sessionId?: string;
    paymentIntentId?: string;
    amountCents?: number;
    currency?: string;
  };
  ip?: string;
};

export type IssuePermitResult = {
  permit: StoredPermit;
  verifyUrl: string;
  qrDataUrl: string;
  delivery: {
    email: { sent: boolean; mode: string; error?: string };
    telegram: { sent: boolean; mode: string; error?: string };
  };
  baseUrl: string;
  warnLocalhost: boolean;
};

/** Emite permiso firmado, persiste, audita y entrega por canales. */
export async function issuePermit(
  input: IssuePermitInput
): Promise<IssuePermitResult> {
  const tarifa = await getTarifaById(input.tarifaId);
  if (!tarifa) {
    throw new Error("Tarifa no encontrada o inactiva");
  }

  const { validoDesde, validoHasta } = computeValidity(tarifa);
  const id = generatePermitId();
  const codigo = generateSecurityCode();
  const dniHash = await hashDni(input.dniClean);

  const payload: PermitPayload = {
    id,
    codigo,
    tarifaId: tarifa.id,
    recolector: tarifa.recolector,
    modalidad: tarifa.modalidad,
    precio: tarifa.precio,
    limite: tarifa.limite,
    nombre: input.nombre,
    email: input.email,
    dniHash,
    dniMask: maskDni(input.dniClean),
    emitidoEn: new Date().toISOString(),
    validoDesde,
    validoHasta,
    parque: `${SITE.parkName} (${SITE.parkCode})`,
    municipio: SITE.location,
  };

  const firma = signPayload(payload);
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(
    /\/$/,
    ""
  );
  const baseUrl =
    input.baseUrlOverride ||
    (input.req ? resolvePublicBaseUrl(input.req) : configured) ||
    "http://localhost:3000";

  const payment = input.payment ?? {
    provider: "simulated" as const,
  };

  const stored: StoredPermit = {
    ...payload,
    firma,
    status: "activo",
    telegramChatId: input.telegramChatId,
    paymentProvider: payment.provider,
    paymentSessionId: payment.sessionId,
    paymentIntentId: payment.paymentIntentId,
    paymentAmountCents: payment.amountCents,
    paymentCurrency: payment.currency ?? "eur",
    paidAt:
      payment.provider === "stripe"
        ? new Date().toISOString()
        : payment.provider === "simulated"
          ? new Date().toISOString()
          : undefined,
  };

  const verifyUrl = buildQrVerificationUrl(baseUrl, id, firma);
  const qrDataUrl = await generateQrDataUrl(verifyUrl);
  stored.qrDataUrl = qrDataUrl;

  await savePermit(stored);

  const payLabel =
    payment.provider === "stripe"
      ? `Stripe ${payment.paymentIntentId || payment.sessionId || ""}`.trim()
      : "simulado";

  void appendAudit({
    action: "compra",
    permitId: stored.id,
    codigo: stored.codigo,
    nombre: stored.nombre,
    email: stored.email,
    dniMask: stored.dniMask,
    recolector: stored.recolector,
    modalidad: stored.modalidad,
    precio: stored.precio,
    tarifaId: stored.tarifaId,
    status: stored.status,
    ip: input.ip ?? (input.req ? clientIp(input.req) : undefined),
    detail: `Compra ${stored.modalidad} · ${stored.precio} € · pago ${payLabel}`,
  }).catch(() => undefined);
  void recordPurchaseDay(new Date(stored.emitidoEn)).catch(() => undefined);

  const emailResult = input.enviarEmail
    ? await sendPermitEmail(stored, verifyUrl, qrDataUrl)
    : { sent: false, mode: "skipped" as const };

  const telegramResult = input.enviarTelegram
    ? await sendPermitTelegram(
        stored,
        verifyUrl,
        qrDataUrl,
        input.telegramChatId
      )
    : { sent: false, mode: "disabled" as const };

  return {
    permit: stored,
    verifyUrl,
    qrDataUrl,
    delivery: {
      email: emailResult,
      telegram: telegramResult,
    },
    baseUrl,
    warnLocalhost: /localhost|127\.0\.0\.1/i.test(baseUrl),
  };
}

export function publicPermitView(
  stored: StoredPermit,
  verifyUrl: string
): Record<string, unknown> {
  return {
    id: stored.id,
    codigo: stored.codigo,
    nombre: stored.nombre,
    email: stored.email,
    dniMask: stored.dniMask,
    recolector: stored.recolector,
    modalidad: stored.modalidad,
    precio: stored.precio,
    limite: stored.limite,
    validoDesde: stored.validoDesde,
    validoHasta: stored.validoHasta,
    parque: stored.parque,
    municipio: stored.municipio,
    emitidoEn: stored.emitidoEn,
    firma: stored.firma,
    qrDataUrl: stored.qrDataUrl,
    status: stored.status,
    verifyUrl,
    paymentProvider: stored.paymentProvider,
    paidAt: stored.paidAt,
  };
}

export async function issuePermitFromOrder(
  order: PendingOrder,
  payment: NonNullable<IssuePermitInput["payment"]>,
  opts?: { req?: NextRequest; baseUrlOverride?: string; ip?: string }
): Promise<IssuePermitResult> {
  if (!order.dni) {
    throw new Error("Pedido sin DNI (ya fulfilled o corrupto)");
  }
  return issuePermit({
    tarifaId: order.tarifaId,
    nombre: order.nombre,
    email: order.email,
    dniClean: order.dni,
    enviarEmail: order.enviarEmail,
    enviarTelegram: order.enviarTelegram,
    telegramChatId: order.telegramChatId,
    payment,
    req: opts?.req,
    baseUrlOverride: opts?.baseUrlOverride,
    ip: opts?.ip,
  });
}
