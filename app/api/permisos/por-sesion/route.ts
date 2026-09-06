import { NextRequest, NextResponse } from "next/server";
import {
  claimPendingOrder,
  getPendingOrderBySession,
  markOrderFulfilled,
} from "@/lib/pending-orders";
import { issuePermitFromOrder, publicPermitView } from "@/lib/issue-permit";
import { getPermit } from "@/lib/permits";
import { getStripe, isPaymentsSimulated } from "@/lib/stripe";
import { resolvePublicBaseUrl } from "@/lib/site-url";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/permisos/por-sesion?session_id=
 * Tras Stripe Checkout: confirma pago, emite si el webhook aún no lo hizo,
 * y devuelve el permiso para “Mi permiso”.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id" },
      { status: 400 }
    );
  }

  if (isPaymentsSimulated()) {
    return NextResponse.json(
      { error: "Pagos Stripe no activos" },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const rl = rateLimit(`por-sesion:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          ok: false,
          status: session.payment_status,
          error: "El pago aún no está confirmado",
        },
        { status: 402 }
      );
    }

    const order = await getPendingOrderBySession(sessionId);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status === "fulfilled" && order.permitId) {
      const permit = await getPermit(order.permitId);
      if (permit) {
        const baseUrl = resolvePublicBaseUrl(req);
        const { buildQrVerificationUrl } = await import("@/lib/permits");
        const verifyUrl = buildQrVerificationUrl(
          baseUrl,
          permit.id,
          permit.firma
        );
        return NextResponse.json({
          ok: true,
          permit: publicPermitView(permit, verifyUrl),
          pago: { modo: "stripe", sessionId },
        });
      }
    }

    const claimed = await claimPendingOrder(order.id);
    if (!claimed) {
      return NextResponse.json(
        {
          error:
            "El permiso se está generando. Espera unos segundos e inténtalo de nuevo.",
        },
        { status: 202 }
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const result = await issuePermitFromOrder(
      claimed,
      {
        provider: "stripe",
        sessionId,
        paymentIntentId,
        amountCents: session.amount_total ?? undefined,
        currency: session.currency ?? "eur",
      },
      { req, ip }
    );

    await markOrderFulfilled(order.id, result.permit.id, paymentIntentId);

    return NextResponse.json({
      ok: true,
      permit: publicPermitView(result.permit, result.verifyUrl),
      delivery: result.delivery,
      pago: { modo: "stripe", sessionId },
    });
  } catch (err) {
    console.error("[por-sesion]", err);
    return NextResponse.json(
      { error: "No se pudo recuperar el permiso" },
      { status: 500 }
    );
  }
}
