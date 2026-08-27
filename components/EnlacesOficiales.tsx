"use client";

import { motion } from "framer-motion";
import { ExternalLink, Smartphone, Map, Trees } from "lucide-react";
import { LINKS } from "@/lib/content";
import { Button } from "@/components/ui/button";

const ENLACES = [
  {
    title: "Micocyl",
    desc: "Plataforma oficial de cotos micológicos de Castilla y León.",
    href: LINKS.micocyl,
    icon: Trees,
  },
  {
    title: "Visor Micodata",
    desc: "Seguimiento en tiempo real de fructificación y predicciones.",
    href: LINKS.micodata,
    icon: Map,
  },
  {
    title: "App Micocyl",
    desc: "Permisos, GPS y partes en tu móvil (Google Play).",
    href: LINKS.appPlay,
    icon: Smartphone,
  },
  {
    title: "ADISAC – Villardeciervos",
    desc: "Rutas y descripción del entorno micológico local.",
    href: LINKS.adisac,
    icon: ExternalLink,
  },
];

export function EnlacesOficiales() {
  return (
    <section className="section-padding bg-muted/40">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Enlaces oficiales
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Recursos oficiales de Micocyl y del territorio para complementar tu
            permiso digital.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ENLACES.map((e, i) => (
            <motion.a
              key={e.title}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-start gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <e.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary">
                  {e.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.a>
          ))}
        </div>

        <div className="mt-6">
          <Button asChild variant="outline">
            <a href={LINKS.pinares} target="_blank" rel="noopener noreferrer">
              Inspiración tarifas: Pinares de Urbión →
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
