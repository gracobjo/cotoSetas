import type { StoredPermit } from "@/lib/permits";
import { buildPermitEmailHtml } from "@/lib/email-template";

export type EmailResult = {
  sent: boolean;
  mode: "resend" | "simulated" | "skipped" | "disabled" | "error";
  error?: string;
};

/**
 * Envío de correo con el comprobante del permiso (Resend).
 * Sin RESEND_API_KEY → modo simulado (consola del servidor).
 */
export async function sendPermitEmail(
  permit: StoredPermit,
  verifyUrl: string,
  qrDataUrl: string
): Promise<EmailResult> {
  if (process.env.EMAIL_ENABLED === "false") {
    return { sent: false, mode: "disabled" };
  }

  const html = buildPermitEmailHtml(permit, verifyUrl, qrDataUrl);
  const subject = `Tu permiso micológico ${permit.codigo} – Villardeciervos`;

  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from =
    process.env.EMAIL_FROM ||
    "Permisos Villardeciervos <onboarding@resend.dev>";

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [permit.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return { sent: false, mode: "error", error: err.slice(0, 200) };
    }
    return { sent: true, mode: "resend" };
  }

  console.info("[email:simulated]", {
    to: permit.email,
    subject,
    permitId: permit.id,
    codigo: permit.codigo,
    verifyUrl,
  });
  return { sent: true, mode: "simulated" };
}
