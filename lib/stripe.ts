import Stripe from "stripe";

/** true si hay clave secreta de Stripe (cobro real). */
export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Forzar modo simulado aunque exista STRIPE_SECRET_KEY (tests). */
export function isPaymentsSimulated(): boolean {
  if (process.env.PAYMENTS_MODE === "simulated") return true;
  return !isStripeEnabled();
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY no configurada");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function stripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
}

/** Convierte euros a céntimos para Stripe. */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}
