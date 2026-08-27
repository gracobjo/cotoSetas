"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Tarifa } from "@/lib/tarifas-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "local", label: "Local" },
  { id: "vinculado", label: "Vinculado" },
  { id: "general", label: "General" },
] as const;

export function TarifasTable() {
  const [filtro, setFiltro] =
    useState<(typeof FILTROS)[number]["id"]>("todos");
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/tarifas");
        const data = await res.json();
        setTarifas(data.tarifas || []);
        setNotas(data.notasCampania || "");
      } catch {
        setTarifas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filas =
    filtro === "todos" ? tarifas : tarifas.filter((t) => t.tipo === filtro);

  return (
    <section id="permisos" className="section-padding bg-muted/40">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Tarifas oficiales Micocyl
          </h2>
          <p className="mt-3 text-muted-foreground">
            {notas ||
              "Parque Micológico Montes del Noroeste Zamorano (PMZA-50.001). Precios editables por el administrador del coto."}
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                filtro === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando tarifas…</p>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de recolector</TableHead>
                    <TableHead>Modalidad / Duración</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Límite</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.recolector}
                        {t.comercial && (
                          <Badge variant="mushroom" className="ml-2">
                            Comercial
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{t.modalidad}</TableCell>
                      <TableCell className="font-display text-lg font-semibold text-mushroom">
                        {t.precio} €
                      </TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">
                        {t.limite}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="mushroom">
                          <Link href={`/comprar?tarifa=${t.id}`}>Comprar</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filas.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{t.recolector}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.modalidad}
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold text-mushroom">
                      {t.precio} €
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t.limite}</p>
                  {t.nota && (
                    <p className="mt-1 text-xs text-muted-foreground">{t.nota}</p>
                  )}
                  <Button asChild variant="mushroom" className="mt-4 w-full">
                    <Link href={`/comprar?tarifa=${t.id}`}>Comprar permiso</Link>
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
