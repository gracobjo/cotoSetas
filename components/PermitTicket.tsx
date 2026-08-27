"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, ExternalLink } from "lucide-react";

export type TicketData = {
  id: string;
  codigo: string;
  nombre: string;
  dniMask: string;
  modalidad: string;
  precio: number;
  limite: string;
  validoDesde: string;
  validoHasta: string;
  parque?: string;
  municipio?: string;
  qrDataUrl?: string;
  verifyUrl?: string;
  status?: string;
};

export function PermitTicket({
  permit,
  compact = false,
}: {
  permit: TicketData;
  compact?: boolean;
}) {
  const desde = format(new Date(permit.validoDesde), "d MMM yyyy HH:mm", {
    locale: es,
  });
  const hasta = format(new Date(permit.validoHasta), "d MMM yyyy HH:mm", {
    locale: es,
  });

  const printTicket = () => window.print();

  return (
    <article
      className="overflow-hidden rounded-xl border-2 border-mushroom/40 bg-card shadow-lg print:border print:shadow-none"
      id="permiso-ticket"
    >
      <div className="bg-mushroom px-4 py-3 text-center text-mushroom-foreground">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
          Permiso micológico digital · Anti-falsificación
        </p>
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Villardeciervos · Sierra de la Culebra
        </h2>
      </div>

      <div className={`p-5 ${compact ? "" : "sm:p-8"}`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Código de acceso
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">
              {permit.codigo}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {permit.id}
            </p>
            {permit.status && (
              <Badge
                variant={permit.status === "activo" ? "success" : "warning"}
                className="mt-3"
              >
                {permit.status.toUpperCase()}
              </Badge>
            )}
          </div>

          {permit.qrDataUrl && (
            <div className="rounded-lg border bg-white p-3">
              <Image
                src={permit.qrDataUrl}
                alt="QR de verificación del permiso"
                width={180}
                height={180}
                unoptimized
                className="h-[180px] w-[180px]"
              />
              <p className="mt-2 text-center text-[10px] text-neutral-600">
                Escanea para verificar
              </p>
              {permit.verifyUrl && (
                <p className="mt-2 max-w-[200px] break-all text-center text-[9px] text-neutral-500">
                  {permit.verifyUrl}
                </p>
              )}
            </div>
          )}
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Titular</dt>
            <dd className="font-medium">{permit.nombre}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">DNI</dt>
            <dd className="font-mono">{permit.dniMask}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Modalidad</dt>
            <dd>{permit.modalidad}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Importe</dt>
            <dd className="font-semibold text-mushroom">
              {permit.precio.toFixed(2)} €
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Límite de recolección</dt>
            <dd>{permit.limite}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Válido desde</dt>
            <dd>{desde}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Válido hasta</dt>
            <dd>{hasta}</dd>
          </div>
        </dl>

        {(permit.parque || permit.municipio) && (
          <p className="mt-4 text-xs text-muted-foreground">
            {permit.parque}
            {permit.municipio ? ` · ${permit.municipio}` : ""}
          </p>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-md bg-primary/10 p-3 text-xs text-foreground/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Documento con firma HMAC-SHA256. Muestra este comprobante en el
            móvil (o impreso) junto a tu DNI al vigilante del coto o SEPRONA.
            Cualquier alteración invalida la verificación online.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={printTicket}>
            <Download className="h-4 w-4" />
            Guardar / Imprimir
          </Button>
          {permit.verifyUrl && (
            <Button asChild variant="secondary" size="sm">
              <a href={permit.verifyUrl}>
                <ExternalLink className="h-4 w-4" />
                Abrir verificación
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
