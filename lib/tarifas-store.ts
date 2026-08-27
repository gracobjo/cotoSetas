import { promises as fs } from "fs";
import path from "path";

export type Tarifa = {
  id: string;
  recolector: string;
  modalidad: string;
  precio: number;
  limite: string;
  limiteKg: number;
  nota?: string;
  tipo: "local" | "vinculado" | "general";
  comercial: boolean;
  dias?: number;
  activa: boolean;
};

export type TarifasConfig = {
  updatedAt: string;
  updatedBy?: string;
  notasCampania: string;
  tarifas: Tarifa[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "tarifas.json");

/** Tarifas base campaña actual (PMZA-50.001 / Zamora) según rangos Micocyl CyL. */
export const DEFAULT_TARIFAS: Tarifa[] = [
  {
    id: "gen-1d",
    recolector: "General (Visitante)",
    modalidad: "1 Día (Recreativo)",
    precio: 5,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Sin empadronamiento ni propiedades en el acotado.",
    tipo: "general",
    comercial: false,
    dias: 1,
    activa: true,
  },
  {
    id: "gen-2d",
    recolector: "General (Visitante)",
    modalidad: "2 Días (Recreativo)",
    precio: 20,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Rango CyL 8–20 €; en Zamora se aplica 20 €.",
    tipo: "general",
    comercial: false,
    dias: 2,
    activa: true,
  },
  {
    id: "gen-temp-rec",
    recolector: "General (Visitante)",
    modalidad: "Temporada (Recreativo)",
    precio: 40,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Rango CyL 30–40 € según zona.",
    tipo: "general",
    comercial: false,
    activa: true,
  },
  {
    id: "gen-temp-com",
    recolector: "General (Visitante)",
    modalidad: "Temporada (Comercial)",
    precio: 150,
    limite: "Hasta 100 kg por persona y día (según zona 20–100 kg)",
    limiteKg: 100,
    nota: "Rango CyL 70–240 € por temporada.",
    tipo: "general",
    comercial: true,
    activa: true,
  },
  {
    id: "vinc-temp-rec",
    recolector: "Vinculado",
    modalidad: "Temporada (Recreativo)",
    precio: 25,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Vínculos familiares, segunda residencia u otras situaciones del ayuntamiento. Rango ~15–25 €.",
    tipo: "vinculado",
    comercial: false,
    activa: true,
  },
  {
    id: "vinc-temp-com",
    recolector: "Vinculado",
    modalidad: "Temporada (Comercial)",
    precio: 50,
    limite: "Hasta 100 kg por persona y día",
    limiteKg: 100,
    nota: "Aproximadamente 50 € en zonas reguladas.",
    tipo: "vinculado",
    comercial: true,
    activa: true,
  },
  {
    id: "local-temp-rec",
    recolector: "Local (Empadronado)",
    modalidad: "Temporada (Recreativo)",
    precio: 5,
    limite: "Hasta 5 kg por persona y día",
    limiteKg: 5,
    nota: "Empadronados del territorio. Rango CyL 3–5 €. Suele exigirse empadronamiento previo a la campaña.",
    tipo: "local",
    comercial: false,
    activa: true,
  },
  {
    id: "local-temp-com",
    recolector: "Local (Empadronado)",
    modalidad: "Temporada (Comercial)",
    precio: 10,
    limite: "Hasta 100 kg por persona y día",
    limiteKg: 100,
    nota: "Reducciones locales; en algunas comarcas ~10 €.",
    tipo: "local",
    comercial: true,
    activa: true,
  },
];

export const DEFAULT_CONFIG: TarifasConfig = {
  updatedAt: new Date().toISOString(),
  notasCampania:
    "Tarifas Micocyl CyL: varían por acotado, uso (recreativo/comercial) y vinculación (local, vinculado, general). Recreativo máx. 5 kg/persona/día; comercial 20–100 kg/día según zona. Valores editables por el administrador del coto.",
  tarifas: DEFAULT_TARIFAS,
};

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

export async function getTarifasConfig(): Promise<TarifasConfig> {
  return ensureFile();
}

export async function getTarifasActivas(): Promise<Tarifa[]> {
  const cfg = await ensureFile();
  return cfg.tarifas.filter((t) => t.activa);
}

export async function getTarifaById(id: string): Promise<Tarifa | undefined> {
  const cfg = await ensureFile();
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
