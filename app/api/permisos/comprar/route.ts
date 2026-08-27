import { NextRequest, NextResponse } from "next/server";
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
import { validateDniNie } from "@/lib/dni";
import { purchaseSchema, sanitizeText } from "@/lib/security";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { appendAudit, recordPurchaseDay } from "@/lib/audit-store";

/**
 * POST /api/permisos/comprar
 * Emite permiso firmado + QR. Validación DNI checksum + rate limit (OWASP).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`comprar:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Inténtalo más tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = purchaseSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de compra inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const nombre = sanitizeText(data.nombre, 120);
    const email = sanitizeText(data.email, 180).toLowerCase();
    const telegramChatId = data.telegramChatId
      ? sanitizeText(data.telegramChatId, 64)
      : undefined;

    if (!data.enviarEmail && !data.enviarTelegram) {
      return NextResponse.json(
        { error: "Elige al menos un canal: email o Telegram" },
        { status: 400 }
      );
    }

    const dniCheck = validateDniNie(data.dni);
    if (!dniCheck.ok) {
      return NextResponse.json({ error: dniCheck.error }, { status: 400 });
    }
    const dniClean = dniCheck.normalized;

    const tarifa = await getTarifaById(data.tarifaId);
    if (!tarifa) {
      return NextResponse.json(
        { error: "Tarifa no encontrada o inactiva" },
        { status: 404 }
      );
    }

    const { validoDesde, validoHasta } = computeValidity(tarifa);
    const id = generatePermitId();
    const codigo = generateSecurityCode();
    const dniHash = await hashDni(dniClean);

    const payload: PermitPayload = {
      id,
      codigo,
      tarifaId: tarifa.id,
      recolector: tarifa.recolector,
      modalidad: tarifa.modalidad,
      precio: tarifa.precio,
      limite: tarifa.limite,
      nombre,
      email,
      dniHash,
      dniMask: maskDni(dniClean),
      emitidoEn: new Date().toISOString(),
      validoDesde,
      validoHasta,
      parque: `${SITE.parkName} (${SITE.parkCode})`,
      municipio: SITE.location,
    };

    const firma = signPayload(payload);
    const baseUrl = resolvePublicBaseUrl(req);

    const stored: StoredPermit = {
      ...payload,
      firma,
      status: "activo",
      telegramChatId,
    };

    // QR y enlaces con URL corta (fácil de escanear / abrir en móvil)
    const verifyUrl = buildQrVerificationUrl(baseUrl, id, firma);
    const qrDataUrl = await generateQrDataUrl(verifyUrl);
    stored.qrDataUrl = qrDataUrl;

    await savePermit(stored);

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
      ip: clientIp(req),
      detail: `Compra ${stored.modalidad} · ${stored.precio} €`,
    }).catch(() => undefined);
    void recordPurchaseDay(new Date(stored.emitidoEn)).catch(() => undefined);

    const emailResult = data.enviarEmail
      ? await sendPermitEmail(stored, verifyUrl, qrDataUrl)
      : { sent: false, mode: "skipped" as const };

    const telegramResult = data.enviarTelegram
      ? await sendPermitTelegram(stored, verifyUrl, qrDataUrl, telegramChatId)
      : { sent: false, mode: "disabled" as const };

    const warnLocalhost = /localhost|127\.0\.0\.1/i.test(baseUrl);

    return NextResponse.json({
      ok: true,
      permit: {
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
      },
      delivery: {
        email: emailResult,
        telegram: telegramResult,
        baseUrl,
        warnLocalhost,
        hint: warnLocalhost
          ? "El QR apunta a localhost: configura NEXT_PUBLIC_SITE_URL con tu IP/dominio público."
          : null,
      },
      email: emailResult,
      pago: {
        modo: "simulado",
        mensaje:
          "Pago simulado. Conecta Stripe o Redsys en producción antes de cobrar.",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al emitir el permiso" },
      { status: 500 }
    );
  }
}
