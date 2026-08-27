"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/use-page-content";

export function Hero() {
  const { content } = usePageContent();
  const hero = content?.hero;

  return (
    <section
      id="inicio"
      className="relative flex min-h-[92vh] items-end overflow-hidden"
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-[position:58%_28%] sm:bg-[position:55%_22%] brightness-[1.08] contrast-[1.08] saturate-[1.05]"
        style={{
          backgroundImage: `url('${hero?.backgroundImage || "/ciervo.png"}')`,
        }}
        role="img"
        aria-label={
          hero?.title || "Ciervo en Villardeciervos, Sierra de la Culebra"
        }
      />
      {/* Solo oscurece la zona del texto; el ciervo queda visible arriba */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-forest-dark/35 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-forest-dark/80 to-transparent" />

      <div className="relative z-10 container-narrow w-full px-4 pb-16 pt-28 sm:px-6 sm:pb-24 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-earth-light"
        >
          {hero?.eyebrow || "PMZA-50.001 · Micocyl"}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {hero?.title || "Villardeciervos"}
          <span className="mt-1 block text-2xl font-normal text-white/85 sm:text-3xl md:text-4xl">
            {hero?.subtitle || "Micología · Sierra de la Culebra"}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
        >
          {hero?.description ||
            "Enclave de enorme riqueza micológica. Obtén tu permiso digital verificable antes de salir al campo."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <Button asChild size="lg" variant="mushroom">
            <Link href="/comprar">
              <FileCheck2 className="h-5 w-5" />
              {hero?.ctaPrimary || "Obtener permiso"}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <a href="#alertas">
              <Bell className="h-5 w-5" />
              {hero?.ctaSecondary || "Activar alerta del primer parte"}
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <a
              href="https://www.micocyl.es/"
              target="_blank"
              rel="noopener noreferrer"
            >
              También en Micocyl →
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
