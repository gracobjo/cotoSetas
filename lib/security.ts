import { z } from "zod";

/** Sanitiza texto libre (OWASP A03 – Injection): recorta y elimina controles. */
export function sanitizeText(input: string, maxLen = 200): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export const purchaseSchema = z.object({
  tarifaId: z.string().min(1).max(64),
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(180),
  dni: z.string().min(8).max(20),
  aceptaNormativa: z.literal(true),
  enviarEmail: z.boolean().optional().default(true),
  enviarTelegram: z.boolean().optional().default(false),
  telegramChatId: z.string().max(64).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

export const tarifaSchema = z.object({
  id: z.string().min(1).max(64),
  recolector: z.string().min(1).max(120),
  modalidad: z.string().min(1).max(120),
  precio: z.number().min(0).max(10000),
  limite: z.string().min(1).max(300),
  limiteKg: z.number().int().min(1).max(500),
  nota: z.string().max(500).optional(),
  tipo: z.enum(["local", "vinculado", "general"]),
  comercial: z.boolean(),
  dias: z.number().int().min(1).max(366).optional(),
  activa: z.boolean(),
});

export const tarifasConfigSchema = z.object({
  notasCampania: z.string().max(2000),
  tarifas: z.array(tarifaSchema).min(1).max(50),
});
