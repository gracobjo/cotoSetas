import { NextRequest, NextResponse } from "next/server";
import { TARIFAS, SITE } from "@/lib/content";
import {
  computeValidity,
  generatePermitId,
  generateSecurityCode,
  hashDni,
  maskDni,
  savePermit,
  signPayload,
  buildVerificationUrl,
  encodePermitToken,
  type PermitPayload,
  type StoredPermit,
} from "@/lib/permits";
import { generateQrDataUrl } from "@/lib/email-template";
import { sendPermitEmail } from "@/lib/email";
import { sendPermitTelegram } from "@/lib/telegram";
import { resolvePublicBaseUrl } from "@/lib/site-url";

/**
 * POST /api/permisos/comprar
 * Emite permiso firmado + QR y entrega por email y/o Telegram.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      tarifaId?: string;
      nombre?: string;
      email?: string;
      dni?: string;
      aceptaNormativa?: boolean;
      enviarEmail?: boolean;
      enviarTelegram?: boolean;
      telegramChatId?: string;
    };

    const {
      tarifaId,
      nombre,
      email,
      dni,
      aceptaNormativa,
      enviarEmail = true,
      enviarTelegram = false,
      telegramChatId,
    } = body;

    if (!tarifaId || !nombre?.trim() || !email?.trim() || !dni?.trim()) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (!aceptaNormativa) {
      return NextResponse.json(
        { error: "Debes aceptar la normativa del coto" },
        { status: 400 }
      );
    }

    if (!enviarEmail && !enviarTelegram) {
      return NextResponse.json(
        { error: "Elige al menos un canal: email o Telegram" },
        { status: 400 }
      );
    }

    const dniClean = dni.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!/^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/.test(dniClean)) {
      return NextResponse.json(
        { error: "DNI/NIE no válido" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    const tarifa = TARIFAS.find((t) => t.id === tarifaId);
    if (!tarifa) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
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
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
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
      telegramChatId: telegramChatId?.trim() || undefined,
    };

    const token = encodePermitToken(stored);
    const verifyUrl = buildVerificationUrl(baseUrl, id, firma, token);
    const qrDataUrl = await generateQrDataUrl(verifyUrl);
    stored.qrDataUrl = qrDataUrl;

    await savePermit(stored);

    const emailResult = enviarEmail
      ? await sendPermitEmail(stored, verifyUrl, qrDataUrl)
      : { sent: false, mode: "skipped" as const };

    const telegramResult = enviarTelegram
      ? await sendPermitTelegram(
          stored,
          verifyUrl,
          qrDataUrl,
          telegramChatId
        )
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
          ? "El QR apunta a localhost: el móvil no podrá abrirlo. Pon tu IP LAN en NEXT_PUBLIC_SITE_URL (ej. http://10.x.x.x:3000) y reinicia."
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
