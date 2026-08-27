import Link from "next/link";
import { LINKS, SITE } from "@/lib/content";

export function Footer() {
  return (
    <footer
      id="contacto"
      className="border-t border-border/60 bg-forest-dark text-primary-foreground"
    >
      <div className="container-narrow section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-semibold">
              {SITE.name}
            </h3>
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
              <li>
                <a
                  href={LINKS.micocyl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Micocyl
                </a>
              </li>
              <li>
                <a
                  href={LINKS.micodata}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Visor Micodata
                </a>
              </li>
              <li>
                <a
                  href={LINKS.appPlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  App Micocyl (Google Play)
                </a>
              </li>
              <li>
                <a
                  href={LINKS.adisac}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  ADISAC – Rutas Villardeciervos
                </a>
              </li>
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
                <a href="#alertas" className="hover:text-white">
                  Alertas del parte
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed text-white/55">
          <p>
            Esta web es informativa y no oficial. Los permisos y partes
            oficiales del Parque Micológico se gestionan también a través de{" "}
            <a
              href={LINKS.micocyl}
              className="underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              micocyl.es
            </a>
            . Los comprobantes emitidos aquí incluyen firma digital HMAC, código
            de seguridad y QR verificable para inspección por vigilantes del
            coto o SEPRONA.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {SITE.name}. Sierra de la Culebra,
            Zamora.
          </p>
        </div>
      </div>
    </footer>
  );
}
