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
    description: "Variables de entorno, admin, email, Telegram y despliegue.",
    file: "manual-configuracion.md",
  },
  {
    slug: "desarrollo",
    title: "Manual de desarrollo",
    description: "Arquitectura, módulos, flujos y guía para contribuir.",
    file: "manual-desarrollo.md",
  },
  {
    slug: "requisitos",
    title: "Requisitos",
    description: "Requisitos funcionales y no funcionales.",
    file: "requisitos.md",
  },
  {
    slug: "casos-de-uso",
    title: "Casos de uso",
    description: "Catálogo y especificaciones de casos de uso.",
    file: "casos-de-uso.md",
  },
  {
    slug: "uml",
    title: "Diagramas UML",
    description: "Clases, objetos, componentes, secuencia y actividades.",
    file: "uml.md",
  },
];

export function getDoc(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug);
}
