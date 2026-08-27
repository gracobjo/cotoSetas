import type { Metadata } from "next";
import Link from "next/link";
import { DocsShell } from "@/components/docs/DocsShell";
import { DOCS } from "@/lib/docs-meta";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Documentación | Villardeciervos Micología",
  description:
    "Manuales de usuario, configuración, desarrollo, requisitos, casos de uso y diagramas UML.",
};

export default function DocumentacionIndexPage() {
  return (
    <DocsShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Documentación del sistema
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Manuales operativos y documentación de ingeniería del proyecto
        Villardeciervos Micología: permisos digitales, administración, seguridad
        OWASP y modelado UML.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {DOCS.map((d) => (
          <Link
            key={d.slug}
            href={`/documentacion/${d.slug}`}
            className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <h2 className="font-display text-xl font-semibold">{d.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </DocsShell>
  );
}
