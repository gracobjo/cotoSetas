"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  ShoppingBasket,
  Ban,
  Scissors,
  Scale,
  Globe,
} from "lucide-react";
import { BUENAS_PRACTICAS } from "@/lib/content";

const ICONS = {
  BadgeCheck,
  ShoppingBasket,
  Ban,
  Scissors,
  Scale,
  Globe,
} as const;

export function BuenasPracticas() {
  return (
    <section className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Regulación y buenas prácticas
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cumple la normativa del coto y protege el micelio para las próximas
            campañas.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BUENAS_PRACTICAS.map((item, i) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <motion.div
                key={item.titulo}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.texto}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
