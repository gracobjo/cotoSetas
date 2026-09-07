import { promises as fs } from "fs";
import path from "path";
import { hasDatabase, kvGet, kvSet } from "@/lib/db";

export type Tarifa = {
  id: string;
  recolector: string;
  modalidad: string;
  precio: number;
  limite: string;
  limiteKg: number;
  /** Texto corto: a quién va dirigido y qué incluye. */
  nota?: string;
  tipo: "local" | "vinculado" | "general";
  comercial: boolean;
  dias?: number;
  activa: boolean;
};

export type TarifasConfig = {
  updatedAt: string;
  updatedBy?: string;
  /** 2 = set oficial Micocyl Zamora 2026 (sin permiso general de 1 día). */
  tarifasVersion?: number;
  notasCampania: string;
  tarifas: Tarifa[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "tarifas.json");
const KV_KEY = "tarifas";

/**
 * Tarifas oficiales PMZA-50.001 / ZA-50.024 (campaña Micocyl Zamora).
 * Fuente: micocyl.es — no hay permiso general de 1 día; general = 20 € / 2 días.
 */
export const DEFAULT_TARIFAS: Tarifa[] = [
  {
    id: "gen-2d",
    recolector: "General (visitante)",
    modalidad: "2 días consecutivos (recreativo)",
    precio: 20,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Cualquier persona sin empadronamiento ni vínculo en el acotado. Válido dos días seguidos (p. ej. fin de semana). No hay permiso general de 1 día ni de temporada en este parque.",
    tipo: "general",
    comercial: false,
    dias: 2,
    activa: true,
  },
  {
    id: "local-temp-rec",
    recolector: "Local (empadronado)",
    modalidad: "Temporada (recreativo)",
    precio: 15,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Empadronado en un municipio del parque o del acotado de ampliación (suele exigirse antigüedad mínima). Válido toda la temporada micológica (hasta el cierre oficial Micocyl).",
    tipo: "local",
    comercial: false,
    activa: true,
  },
  {
    id: "local-temp-com",
    recolector: "Local (empadronado)",
    modalidad: "Temporada (comercial)",
    precio: 15,
    limite: "Hasta 100 kg por persona y día",
    limiteKg: 100,
    nota: "Misma tarifa bonificada local, con cupo comercial. Requiere acreditar empadronamiento. Uso para venta/aprovechamiento comercial según normativa.",
    tipo: "local",
    comercial: true,
    activa: true,
  },
  {
    id: "vinc-temp-rec",
    recolector: "Vinculado",
    modalidad: "Temporada (recreativo)",
    precio: 25,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "No empadronado, pero con vínculo: propiedad en el municipio (IBI/tasa), nacido allí, o familiar de 1.er grado empadronado/vinculado. Toda la temporada.",
    tipo: "vinculado",
    comercial: false,
    activa: true,
  },
  {
    id: "vinc-temp-com",
    recolector: "Vinculado",
    modalidad: "Temporada (comercial)",
    precio: 50,
    limite: "Hasta 100 kg por persona y día",
    limiteKg: 100,
    nota: "Misma condición de vinculado, con cupo comercial (hasta 100 kg/día). Toda la temporada.",
    tipo: "vinculado",
    comercial: true,
    activa: true,
  },
];

export const DEFAULT_CONFIG: TarifasConfig = {
  updatedAt: new Date().toISOString(),
  tarifasVersion: 2,
  notasCampania:
    "Parque Micológico Montes del Noroeste Zamorano (PMZA-50.001) y acotado de ampliación (ZA-50.024). Un solo permiso vale en ambos. Precios alineados con Micocyl; el administrador del coto puede ajustarlos.",
  tarifas: DEFAULT_TARIFAS,
};

/** Guía pública: qué diferencia a cada tipo de recolector / modalidad. */
export const GUIA_TIPOS_PERMISO = [
  {
    id: "general",
    titulo: "General (visitante)",
    texto:
      "Quien no está empadronado ni tiene vínculo con los municipios del acotado. En Zamora la modalidad oficial es de 2 días consecutivos (20 € recreativo). No existe permiso general de 1 día ni de temporada en este parque.",
  },
  {
    id: "local",
    titulo: "Local (empadronado)",
    texto:
      "Empadronado en un municipio del parque o del acotado de ampliación. Tarifa bonificada de temporada (recreativo o comercial). Suele acreditarse en el ayuntamiento o con documentación de empadronamiento.",
  },
  {
    id: "vinculado",
    titulo: "Vinculado",
    texto:
      "No empadronado, pero con vínculo: propiedad (IBI/tasa a su nombre), nacimiento en el municipio, o familiar de primer grado empadronado/vinculado. Temporada a precio intermedio.",
  },
  {
    id: "recreativo-comercial",
    titulo: "Recreativo vs comercial",
    texto:
      "Recreativo: máximo habitual 5 kg por persona y día, consumo propio. Comercial: cupo mayor (hasta 100 kg/día) para aprovechamiento comercial, sujeto a la normativa del coto.",
  },
  {
    id: "duracion",
    titulo: "Duración",
    texto:
      "2 días: dos jornadas consecutivas a elegir. Temporada: desde la emisión hasta el cierre oficial de campaña Micocyl (normalmente 31 de julio). El límite de kg es por día, no por todo el permiso.",
  },
] as const;

async function ensureFile(): Promise<TarifasConfig> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as TarifasConfig;
    if (!parsed.tarifas?.length) return DEFAULT_CONFIG;
    return parsed;
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
    return DEFAULT_CONFIG;
  }
}

async function loadConfig(): Promise<TarifasConfig> {
  if (hasDatabase()) {
    const fromDb = await kvGet<TarifasConfig>(KV_KEY);
    if (fromDb?.tarifas?.length) {
      // Una sola vez: pasar del catálogo antiguo (1 día / temporada general) al oficial Zamora 2026
      if ((fromDb.tarifasVersion ?? 1) < 2) {
        return saveTarifasConfig(DEFAULT_CONFIG, "migration-v2");
      }
      return fromDb;
    }
    await kvSet(KV_KEY, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  const fileCfg = await ensureFile();
  if ((fileCfg.tarifasVersion ?? 1) < 2) {
    return saveTarifasConfig(DEFAULT_CONFIG, "migration-v2");
  }
  return fileCfg;
}

export async function getTarifasConfig(): Promise<TarifasConfig> {
  return loadConfig();
}

export async function getTarifasActivas(): Promise<Tarifa[]> {
  const cfg = await loadConfig();
  return cfg.tarifas.filter((t) => t.activa);
}

export async function getTarifaById(id: string): Promise<Tarifa | undefined> {
  const cfg = await loadConfig();
  return cfg.tarifas.find((t) => t.id === id && t.activa);
}

export async function saveTarifasConfig(
  config: TarifasConfig,
  updatedBy?: string
): Promise<TarifasConfig> {
  const next: TarifasConfig = {
    ...config,
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

/** Sustituye la configuración por los defaults oficiales Micocyl Zamora. */
export async function resetTarifasToDefault(
  updatedBy?: string
): Promise<TarifasConfig> {
  return saveTarifasConfig(
    {
      ...DEFAULT_CONFIG,
      updatedAt: new Date().toISOString(),
    },
    updatedBy
  );
}
