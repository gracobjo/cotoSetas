import type { StoredPermit } from "@/lib/permits";

export type DeliveryResult = {
  sent: boolean;
  mode: "telegram" | "simulated" | "disabled" | "error";
  error?: string;
};

/**
 * Envía el permiso por Telegram (Bot API).
 * Requiere TELEGRAM_BOT_TOKEN y un chat_id (del formulario o TELEGRAM_DEFAULT_CHAT_ID).
 *
 * Cómo obtener tu chat_id:
 * 1. Habla con tu bot en Telegram (/start)
 * 2. Abre https://api.telegram.org/bot<TOKEN>/getUpdates
 * 3. Busca "chat":{"id": 123456789}
 */
export async function sendPermitTelegram(
  permit: StoredPermit,
  verifyUrl: string,
  qrDataUrl: string,
  chatIdOverride?: string
): Promise<DeliveryResult> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId =
    (chatIdOverride || "").trim() ||
    (process.env.TELEGRAM_DEFAULT_CHAT_ID || "").trim();

  if (process.env.TELEGRAM_ENABLED === "false") {
    return { sent: false, mode: "disabled" };
  }

  if (!token) {
    return { sent: false, mode: "disabled", error: "TELEGRAM_BOT_TOKEN vacío" };
  }
  if (!chatId) {
    return {
      sent: false,
      mode: "error",
      error: "Falta chat_id de Telegram",
    };
  }

  const caption = [
    "🍄 *PERMISO MICOLÓGICO DIGITAL*",
    `*${permit.codigo}*`,
    "",
    `Titular: ${escapeMd(permit.nombre)}`,
    `DNI: \`${permit.dniMask}\``,
    `Modalidad: ${escapeMd(permit.modalidad)}`,
    `Límite: ${escapeMd(permit.limite)}`,
    `Importe: ${permit.precio.toFixed(2)} €`,
    `ID: \`${permit.id}\``,
    "",
    "Muestra este QR al vigilante o SEPRONA.",
    `[Verificar permiso](${verifyUrl})`,
  ].join("\n");

  try {
    // 1) Mensaje con enlace de verificación
    const msgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );
    if (!msgRes.ok) {
      const err = await msgRes.text();
      console.error("[telegram:sendMessage]", err);
      return { sent: false, mode: "error", error: err.slice(0, 200) };
    }

    // 2) Foto del QR (multipart)
    const base64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append(
      "photo",
      new Blob([new Uint8Array(buffer)], { type: "image/png" }),
      `permiso-${permit.codigo}.png`
    );
    form.append(
      "caption",
      `QR de verificación · ${permit.codigo}\nEscanea o abre el enlace del mensaje anterior.`
    );

    const photoRes = await fetch(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      { method: "POST", body: form }
    );
    if (!photoRes.ok) {
      const err = await photoRes.text();
      console.error("[telegram:sendPhoto]", err);
      // El mensaje ya se envió; no fallamos del todo
      return { sent: true, mode: "telegram", error: `QR no enviado: ${err.slice(0, 120)}` };
    }

    return { sent: true, mode: "telegram" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error Telegram";
    console.error("[telegram]", message);
    return { sent: false, mode: "error", error: message };
  }
}

function escapeMd(text: string): string {
  return text.replace(/([_*`\[\]])/g, "\\$1");
}
