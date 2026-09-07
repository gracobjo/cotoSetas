import { promises as fs } from "fs";
import path from "path";
import { hasDatabase, kvGet, kvSet } from "@/lib/db";

/**
 * Contrato de gestión integral (uso interno del admin).
 * Modelo: cuota por web + soporte + alertas + panel admin.
 */

export type ContratoServicios = {
  web: boolean;
  soporte: boolean;
  alertas: boolean;
  admin: boolean;
};

export type ContratoGestion = {
  updatedAt: string;
  updatedBy?: string;
  /** Nombre del cliente (ayuntamiento / coto / entidad) */
  cliente: string;
  /** Referencia interna del contrato */
  referencia: string;
  estado: "borrador" | "activo" | "pausado" | "finalizado";
  fechaInicio: string;
  fechaFin: string;
  /** Cuota acordada (texto libre: "1.200 € / temporada", etc.) */
  cuota: string;
  /** Periodicidad: temporada, anual, mensual… */
  periodicidad: string;
  servicios: ContratoServicios;
  /** Alcance / qué incluye (notas internas) */
  alcance: string;
  /** Qué no incluye */
  exclusiones: string;
  /** Contacto del cliente para soporte */
  contactoCliente: string;
  /** Notas internas del gestor */
  notasInternas: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "contrato.json");
const KV_KEY = "contrato_gestion";

export const DEFAULT_CONTRATO: ContratoGestion = {
  updatedAt: new Date().toISOString(),
  cliente: "Coto micológico Villardeciervos / PMZA-50.001",
  referencia: "GEST-VDC-2026",
  estado: "activo",
  fechaInicio: "2026-09-01",
  fechaFin: "2027-07-31",
  cuota: "A acordar (€ / temporada)",
  periodicidad: "Temporada micológica",
  servicios: {
    web: true,
    soporte: true,
    alertas: true,
    admin: true,
  },
  alcance:
    "Gestión integral: web pública de información y compra de permisos digitales (Stripe), panel de administración (tarifas, contenido, permisos, KPIs), alertas del parte micológico y soporte operativo al coto.",
  exclusiones:
    "No incluye emisión oficial Micocyl ni representación jurídica ante terceros. Los importes de los permisos se liquidan según acuerdo con el coto. Soporte fuera de horario laborable solo en incidencias críticas de cobro/emisión.",
  contactoCliente: "",
  notasInternas: "",
};

async function ensureFile(): Promise<ContratoGestion> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...DEFAULT_CONTRATO, ...(JSON.parse(raw) as ContratoGestion) };
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_CONTRATO, null, 2), "utf8");
    return DEFAULT_CONTRATO;
  }
}

export async function getContrato(): Promise<ContratoGestion> {
  if (hasDatabase()) {
    const fromDb = await kvGet<ContratoGestion>(KV_KEY);
    if (fromDb) return { ...DEFAULT_CONTRATO, ...fromDb, servicios: { ...DEFAULT_CONTRATO.servicios, ...fromDb.servicios } };
    await kvSet(KV_KEY, DEFAULT_CONTRATO);
    return DEFAULT_CONTRATO;
  }
  return ensureFile();
}

export async function saveContrato(
  data: Omit<ContratoGestion, "updatedAt" | "updatedBy"> & {
    updatedAt?: string;
    updatedBy?: string;
  },
  updatedBy?: string
): Promise<ContratoGestion> {
  const next: ContratoGestion = {
    ...DEFAULT_CONTRATO,
    ...data,
    servicios: { ...DEFAULT_CONTRATO.servicios, ...data.servicios },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  if (hasDatabase()) {
    await kvSet(KV_KEY, next);
    return next;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
