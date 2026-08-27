"use client";

import Link from "next/link";
import { SITE } from "@/lib/content";
import { usePageContent } from "@/hooks/use-page-content";

export function Footer() {
  const { content } = usePageContent();
  const links = content?.enlaces.items?.slice(0, 6) || [];
  const disclaimer =
    content?.footer.disclaimer ||
    "Esta web es informativa y no oficial. Los permisos oficiales se gestionan también en micocyl.es.";

  return (
    <footer
      id="contacto"
      className="border-t border-border/60 bg-forest-dark text-primary-foreground"
    >
      <div className="container-narrow section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-semibold">{SITE.name}</h3>
            <p className="mt-2 text-sm text-white/70">
              {SITE.location}
              <br />
              {SITE.parkName} ({SITE.parkCode})
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Enlaces oficiales
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    {l.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Permisos digitales
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/comprar" className="hover:text-white">
                  Comprar permiso
                </Link>
              </li>
              <li>
                <Link href="/mi-permiso" className="hover:text-white">
                  Recuperar mi permiso
                </Link>
              </li>
              <li>
                <Link href="/documentacion" className="hover:text-white">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white">
                  Administración
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed text-white/55">
          <p>{disclaimer}</p>
          <p className="mt-2">
            © {new Date().getFullYear()} {SITE.name}. Sierra de la Culebra,
            Zamora.
          </p>
        </div>
      </div>
    </footer>
  );
}
