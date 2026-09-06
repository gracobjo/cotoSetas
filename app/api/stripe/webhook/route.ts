import { NextRequest, NextResponse } from "next/server";
import {
  claimPendingOrder,
  getPendingOrder,
  getPendingOrderBySession,
  getPermitIdByPaymentIntent,
  markOrderFulfilled,
} from "@/lib/pending-orders";
import { issuePermitFromOrder } from "@/lib/issue-permit";
import {
  getStripe,
  isPaymentsSimulated,
  stripeWebhookSecret,
} from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 * Emite el permiso solo tras checkout.session.completed.
 */
export async function POST(req: NextRequest) {
  if (isPaymentsSimulated()) {
    return NextResponse.json(
      { error: "Stripe no está activo en este entorno" },
      { status: 503 }
    );
  }

  const secret = stripeWebhookSecret();
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET no configurada");
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe] firma inválida", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSession(session);
    }
  } catch (err) {
    console.error("[stripe] error al cumplir pedido", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }

  const orderId = session.metadata?.orderId;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentIntentId) {
    const existing = await getPermitIdByPaymentIntent(paymentIntentId);
    if (existing) return;
  }

  const order =
    (orderId ? await getPendingOrder(orderId) : null) ||
    (await getPendingOrderBySession(session.id));

  if (!order) {
    console.error("[stripe] pedido no encontrado", session.id, orderId);
    return;
  }

  if (order.status === "fulfilled" && order.permitId) {
    return;
  }

  const claimed = await claimPendingOrder(order.id);
  if (!claimed) {
    return;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const result = await issuePermitFromOrder(
    claimed,
    {
      provider: "stripe",
      sessionId: session.id,
      paymentIntentId,
      amountCents: session.amount_total ?? undefined,
      currency: session.currency ?? "eur",
    },
    { baseUrlOverride: baseUrl || undefined }
  );

  await markOrderFulfilled(order.id, result.permit.id, paymentIntentId);
}
