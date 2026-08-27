import Link from "next/link";
import { DOCS, type DocSlug } from "@/lib/docs-meta";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export function DocsNav({ current }: { current?: DocSlug }) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-mushroom" />
        Documentación
      </div>
      <nav className="flex flex-col gap-1">
        <Link
          href="/documentacion"
          className={cn(
            "rounded-md px-3 py-2 text-sm transition-colors",
            !current
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Índice
        </Link>
        {DOCS.map((d) => (
          <Link
            key={d.slug}
            href={`/documentacion/${d.slug}`}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              current === d.slug
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {d.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
