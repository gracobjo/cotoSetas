import { promises as fs } from "fs";
import path from "path";
import { LINKS, SITE } from "@/lib/content";

export type LinkIcon =
  | "Trees"
  | "Map"
  | "Smartphone"
  | "ExternalLink"
  | "Globe"
  | "Leaf"
  | "Link2"
  | "BookOpen";

export type OfficialLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LinkIcon;
  order: number;
  active: boolean;
};

export type PageContent = {
  updatedAt: string;
  updatedBy?: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
    backgroundImage: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  intro: {
    title: string;
    /** HTML básico permitido (p, br, strong, em, a, ul, ol, li) */
    html: string;
  };
  enlaces: {
    title: string;
    subtitle: string;
    secondaryCtaLabel: string;
    secondaryCtaUrl: string;
    items: OfficialLink[];
  };
  contacto: {
    whatsappUrl: string;
  };
  footer: {
    disclaimer: string;
  };
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "contenido.json");

export const DEFAULT_CONTENT: PageContent = {
  updatedAt: new Date().toISOString(),
  hero: {
    eyebrow: `${SITE.parkCode} · Micocyl`,
    title: "Villardeciervos",
    subtitle: "Micología · Sierra de la Culebra",
    description:
      "Enclave de enorme riqueza micológica en pleno corazón de la Sierra de la Culebra. Obtén tu permiso digital verificable antes de salir al campo.",
    backgroundImage: "/ciervo.png",
    ctaPrimary: "Obtener permiso",
    ctaSecondary: "Activar alerta del primer parte",
  },
  intro: {
    title: "Corazón micológico de la Culebra",
    html: `<p>Villardeciervos se encuentra en pleno corazón de la Sierra de la Culebra (Zamora), un enclave de enorme riqueza micológica gestionado bajo la red oficial de Micocyl. La recolección en sus montes públicos y pinares está estrictamente regulada, por lo que es obligatorio obtener un pase antes de salir al campo.</p>`,
  },
  enlaces: {
    title: "Enlaces oficiales",
    subtitle:
      "Recursos oficiales de Micocyl y del territorio para complementar tu permiso digital.",
    secondaryCtaLabel: "Inspiración tarifas: Pinares de Urbión →",
    secondaryCtaUrl: LINKS.pinares,
    items: [
      {
        id: "micocyl",
        title: "Micocyl",
        description:
          "Plataforma oficial de cotos micológicos de Castilla y León.",
        url: LINKS.micocyl,
        icon: "Trees",
        order: 1,
        active: true,
      },
      {
        id: "micodata",
        title: "Visor Micodata",
        description:
          "Seguimiento en tiempo real de fructificación y predicciones.",
        url: LINKS.micodata,
        icon: "Map",
        order: 2,
        active: true,
      },
      {
        id: "app",
        title: "App Micocyl",
        description: "Permisos, GPS y partes en tu móvil (Google Play).",
        url: LINKS.appPlay,
        icon: "Smartphone",
        order: 3,
        active: true,
      },
      {
        id: "adisac",
        title: "ADISAC – Villardeciervos",
        description: "Rutas y descripción del entorno micológico local.",
        url: LINKS.adisac,
        icon: "ExternalLink",
        order: 4,
        active: true,
      },
    ],
  },
  contacto: {
    whatsappUrl: LINKS.whatsapp,
  },
  footer: {
    disclaimer:
      "Esta web es informativa y no oficial. Los permisos y partes oficiales del Parque Micológico se gestionan también a través de micocyl.es. Los comprobantes emitidos aquí incluyen firma digital HMAC, código de seguridad y QR verificable para inspección por vigilantes del coto o SEPRONA.",
  },
};

/** Sanitiza HTML básico (OWASP A03): elimina scripts, iframes y handlers. */
export function sanitizeBasicHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 20000);
}

async function ensureFile(): Promise<PageContent> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as PageContent;
    if (!parsed.enlaces?.items) return DEFAULT_CONTENT;
    return parsed;
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), "utf8");
    return DEFAULT_CONTENT;
  }
}

export async function getPageContent(): Promise<PageContent> {
  return ensureFile();
}

export async function savePageContent(
  content: PageContent,
  updatedBy?: string
): Promise<PageContent> {
  const next: PageContent = {
    ...content,
    intro: {
      ...content.intro,
      html: sanitizeBasicHtml(content.intro.html),
    },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
