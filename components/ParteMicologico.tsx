"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CloudRain, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PARTE_ACTUAL, LINKS } from "@/lib/content";
import { Button } from "@/components/ui/button";

function useCountdown(targetIso: string) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ d: 0, h: 0, m: 0, s: 0, done: true });
        return;
      }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return left;
}

export function ParteMicologico() {
  const cd = useCountdown(PARTE_ACTUAL.countdownTarget);

  return (
    <section id="parte" className="section-padding bg-muted/40">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Parte micológico
            </h2>
            <Badge variant="warning">{PARTE_ACTUAL.fechaBadge}</Badge>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Estado actual de la fructificación en el Parque Micológico Montes
            del Noroeste Zamorano.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg border border-amber-500/30 bg-card p-6 lg:col-span-2"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {PARTE_ACTUAL.estado}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {PARTE_ACTUAL.resumen}
                </p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {PARTE_ACTUAL.prediccion}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a
                    href={LINKS.micodata}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir visor Micodata
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border bg-card p-6"
          >
            <div className="mb-3 flex items-center gap-2 text-primary">
              <CalendarClock className="h-5 w-5" />
              <h3 className="font-semibold">Cuenta atrás</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Hasta la 2ª quincena de septiembre (reactivación de partes)
            </p>
            {cd.done ? (
              <p className="font-display text-lg text-primary">
                Temporada de partes activa
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { v: cd.d, l: "días" },
                  { v: cd.h, l: "hrs" },
                  { v: cd.m, l: "min" },
                  { v: cd.s, l: "seg" },
                ].map((x) => (
                  <div key={x.l} className="rounded-md bg-muted/80 py-2">
                    <div className="font-display text-xl font-bold tabular-nums">
                      {x.v}
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {x.l}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CloudRain className="h-4 w-4" />
              Seguimiento en tiempo real en Micodata
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
