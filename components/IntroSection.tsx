"use client";

import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Leaf } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";

export function IntroSection() {
  const { content } = usePageContent();
  const intro = content?.intro;

  return (
    <section className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {intro?.title || "Corazón micológico de la Culebra"}
          </h2>
          {intro?.html ? (
            <div
              className="mt-5 space-y-3 text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: intro.html }}
            />
          ) : (
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Villardeciervos se encuentra en pleno corazón de la Sierra de la
              Culebra (Zamora), un enclave de enorme riqueza micológica
              gestionado bajo la red oficial de Micocyl.
            </p>
          )}
        </motion.div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Ubicación",
              text: "Sierra de la Culebra · Parque Micológico Montes del Noroeste Zamorano (PMZA-50.001)",
            },
            {
              icon: ShieldCheck,
              title: "Permiso obligatorio",
              text: "Digital o impreso, junto al DNI. Comprobante con QR verificable ante vigilantes o SEPRONA.",
            },
            {
              icon: Leaf,
              title: "Gestión Micocyl",
              text: "Red oficial de cotos micológicos de Castilla y León. Visor Micodata y partes predictivos.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
