export type DocSlug =
  | "usuario"
  | "configuracion"
  | "desarrollo"
  | "requisitos"
  | "casos-de-uso"
  | "uml";

export type DocMeta = {
  slug: DocSlug;
  title: string;
  description: string;
  file: string;
};

export const DOCS: DocMeta[] = [
  {
    slug: "usuario",
    title: "Manual de usuario",
    description: "Cómo usar la web, comprar y mostrar el permiso.",
    file: "manual-usuario.md",
  },
  {
    slug: "configuracion",
    title: "Manual de configuración",
    description: "Variables de entorno, admin, KPIs, email, Telegram y despliegue.",
    file: "manual-configuracion.md",
  },
  {
    slug: "desarrollo",
    title: "Manual de desarrollo",
    description: "Arquitectura, módulos, KPIs/auditoría, flujos y guía para contribuir.",
    file: "manual-desarrollo.md",
  },
  {
    slug: "requisitos",
    title: "Requisitos",
    description: "Requisitos funcionales y no funcionales (incl. KPIs y auditoría).",
    file: "requisitos.md",
  },
  {
    slug: "casos-de-uso",
    title: "Casos de uso",
    description: "Catálogo y especificaciones, incluido dashboard de KPIs.",
    file: "casos-de-uso.md",
  },
  {
    slug: "uml",
    title: "Diagramas UML",
    description: "Clases, objetos, componentes, secuencia, actividades y KPIs.",
    file: "uml.md",
  },
];

export function getDoc(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug);
}
