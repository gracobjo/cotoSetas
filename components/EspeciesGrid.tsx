"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ESPECIES } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EspeciesGrid() {
  return (
    <section id="especies" className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Principales especies
          </h2>
          <p className="mt-3 text-muted-foreground">
            Las setas más características de los montes y pinares de
            Villardeciervos y la Sierra de la Culebra.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ESPECIES.map((sp, i) => (
            <motion.div
              key={sp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <Card className="h-full overflow-hidden border-border/70">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={sp.imagen}
                    alt={sp.nombre}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="mb-1">
                    <Badge variant="secondary">{sp.epoca}</Badge>
                  </div>
                  <CardTitle className="text-xl">{sp.nombre}</CardTitle>
                  <CardDescription className="italic">
                    {sp.cientifico}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {sp.descripcion}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
