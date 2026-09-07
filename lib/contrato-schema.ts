import { z } from "zod";

export const contratoGestionSchema = z.object({
  cliente: z.string().min(1).max(200),
  referencia: z.string().min(1).max(80),
  estado: z.enum(["borrador", "activo", "pausado", "finalizado"]),
  fechaInicio: z.string().min(4).max(32),
  fechaFin: z.string().min(4).max(32),
  cuota: z.string().max(200),
  periodicidad: z.string().max(120),
  servicios: z.object({
    web: z.boolean(),
    soporte: z.boolean(),
    alertas: z.boolean(),
    admin: z.boolean(),
  }),
  alcance: z.string().max(4000),
  exclusiones: z.string().max(4000),
  contactoCliente: z.string().max(500),
  notasInternas: z.string().max(4000),
});
