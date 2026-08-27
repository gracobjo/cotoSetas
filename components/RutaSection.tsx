"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/content";
import { MapPinned, Trees } from "lucide-react";

export function RutaSection() {
  const { lat, lng } = SITE.coordinates;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.12}%2C${lat - 0.08}%2C${lng + 0.12}%2C${lat + 0.08}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <section id="rutas" className="section-padding bg-muted/40">
      <div className="container-narrow">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-mushroom">
              Ruta recomendada
            </p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Embalse de Valparaíso
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Camino que une el pueblo con el río Valdalla y el embalse. Amplios
              pinares idóneos para níscalos y boletos. Recuerda llevar siempre
              tu permiso digital (QR) y respetar los límites de captura.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Punto de referencia: Villardeciervos ({lat}, {lng})
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Trees className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Entorno de pinares de la Sierra de la Culebra, ideal en otoño
                  tras lluvias.
                </span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-lg border shadow-sm"
          >
            <iframe
              title="Mapa OpenStreetMap centrado en Villardeciervos"
              src={osmEmbed}
              className="h-[320px] w-full border-0 sm:h-[380px]"
              loading="lazy"
            />
            <p className="bg-card px-3 py-2 text-xs text-muted-foreground">
              Mapa ©{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                OpenStreetMap
              </a>{" "}
              contributors
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
