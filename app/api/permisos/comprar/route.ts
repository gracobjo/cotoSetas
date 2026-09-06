import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getTarifaById } from "@/lib/tarifas-store";
import { validateDniNie } from "@/lib/dni";
import { purchaseSchema, sanitizeText } from "@/lib/security";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resolvePublicBaseUrl } from "@/lib/site-url";
import {
  eurosToCents,
  getStripe,
  isPaymentsSimulated,
} from "@/lib/stripe";
import {
  savePendingOrder,
  type PendingOrder,
} from "@/lib/pending-orders";
import { issuePermit, publicPermitView } from "@/lib/issue-permit";

/**
 * POST /api/permisos/comprar
 * - Con Stripe: crea Checkout Session y redirige (no emite hasta webhook/éxito).
 * - Sin Stripe (o PAYMENTS_MODE=simulated): emite al instante (dev).
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

    // --- Pago real: Stripe Checkout ---
    if (!isPaymentsSimulated()) {
      const orderId = `ord_${randomBytes(12).toString("hex")}`;
      const baseUrl = resolvePublicBaseUrl(req);
      const order: PendingOrder = {
        id: orderId,
        tarifaId: tarifa.id,
        nombre,
        email,
        dni: dniClean,
        enviarEmail: Boolean(data.enviarEmail),
        enviarTelegram: Boolean(data.enviarTelegram),
        telegramChatId,
        precio: tarifa.precio,
        modalidad: tarifa.modalidad,
        recolector: tarifa.recolector,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        locale: "es",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: eurosToCents(tarifa.precio),
              product_data: {
                name: `Permiso micológico · ${tarifa.modalidad}`,
                description: `${tarifa.recolector} · ${SITE_PARK_LABEL()} · ${tarifa.limite}`,
              },
            },
          },
        ],
        metadata: {
          orderId,
          tarifaId: tarifa.id,
        },
        success_url: `${baseUrl}/comprar/exito?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/comprar?tarifa=${encodeURIComponent(tarifa.id)}&cancel=1`,
      });

      order.stripeSessionId = session.id;
      await savePendingOrder(order);

      if (!session.url) {
        return NextResponse.json(
          { error: "No se pudo iniciar el pago con Stripe" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        pago: {
          modo: "stripe",
          checkoutUrl: session.url,
          sessionId: session.id,
          orderId,
        },
      });
    }

    // --- Modo simulado (dev / sin STRIPE_SECRET_KEY) ---
    const result = await issuePermit({
      tarifaId: tarifa.id,
      nombre,
      email,
      dniClean,
      enviarEmail: Boolean(data.enviarEmail),
      enviarTelegram: Boolean(data.enviarTelegram),
      telegramChatId,
      req,
      ip,
      payment: {
        provider: "simulated",
        amountCents: eurosToCents(tarifa.precio),
        currency: "eur",
      },
    });

    return NextResponse.json({
      ok: true,
      permit: publicPermitView(result.permit, result.verifyUrl),
      delivery: {
        email: result.delivery.email,
        telegram: result.delivery.telegram,
        baseUrl: result.baseUrl,
        warnLocalhost: result.warnLocalhost,
        hint: result.warnLocalhost
          ? "El QR apunta a localhost: configura NEXT_PUBLIC_SITE_URL con tu IP/dominio público."
          : null,
      },
      email: result.delivery.email,
      pago: {
        modo: "simulado",
        mensaje:
          "Pago simulado (sin STRIPE_SECRET_KEY o PAYMENTS_MODE=simulated). En producción configura Stripe.",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al procesar la compra" },
      { status: 500 }
    );
  }
}

function SITE_PARK_LABEL(): string {
  return "PMZA-50.001 · Villardeciervos";
}
