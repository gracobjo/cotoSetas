"use client";

import type { ContratoGestion, ContratoServicios } from "@/lib/contrato-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, FileText } from "lucide-react";

const SERVICIO_LABELS: { key: keyof ContratoServicios; label: string; hint: string }[] =
  [
    {
      key: "web",
      label: "Web",
      hint: "Landing, tarifas, compra Stripe, QR y email",
    },
    {
      key: "admin",
      label: "Panel admin",
      hint: "Tarifas, contenido, permisos, KPIs y revocación",
    },
    {
      key: "alertas",
      label: "Alertas",
      hint: "Parte micológico y aviso del primer parte",
    },
    {
      key: "soporte",
      label: "Soporte",
      hint: "Incidencias, campaña, Stripe, hosting",
    },
  ];

const ESTADO_VARIANT: Record<
  ContratoGestion["estado"],
  "success" | "warning" | "secondary" | "destructive"
> = {
  activo: "success",
  borrador: "secondary",
  pausado: "warning",
  finalizado: "destructive",
};

export function AdminContratoForm({
  contrato,
  onChange,
  onSave,
  saving,
}: {
  contrato: ContratoGestion;
  onChange: (next: ContratoGestion) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof ContratoGestion>(key: K, value: ContratoGestion[K]) => {
    onChange({ ...contrato, [key]: value });
  };

  const setServicio = (key: keyof ContratoServicios, value: boolean) => {
    onChange({
      ...contrato,
      servicios: { ...contrato.servicios, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <FileText className="h-5 w-5 text-mushroom" />
            Contrato de gestión integral
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ficha interna del servicio al coto: web + soporte + alertas + admin.
            No es pública; solo visible en este panel.
          </p>
        </div>
        <Badge variant={ESTADO_VARIANT[contrato.estado]}>
          {contrato.estado}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cliente">Cliente / entidad</Label>
          <Input
            id="cliente"
            className="mt-1.5"
            value={contrato.cliente}
            onChange={(e) => set("cliente", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="referencia">Referencia</Label>
          <Input
            id="referencia"
            className="mt-1.5 font-mono"
            value={contrato.referencia}
            onChange={(e) => set("referencia", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <select
            id="estado"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={contrato.estado}
            onChange={(e) =>
              set("estado", e.target.value as ContratoGestion["estado"])
            }
          >
            <option value="borrador">Borrador</option>
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
        <div>
          <Label htmlFor="fechaInicio">Inicio</Label>
          <Input
            id="fechaInicio"
            type="date"
            className="mt-1.5"
            value={contrato.fechaInicio.slice(0, 10)}
            onChange={(e) => set("fechaInicio", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fechaFin">Fin / renovación</Label>
          <Input
            id="fechaFin"
            type="date"
            className="mt-1.5"
            value={contrato.fechaFin.slice(0, 10)}
            onChange={(e) => set("fechaFin", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cuota">Cuota acordada</Label>
          <Input
            id="cuota"
            className="mt-1.5"
            value={contrato.cuota}
            onChange={(e) => set("cuota", e.target.value)}
            placeholder="ej. 1.200 € / temporada"
          />
        </div>
        <div>
          <Label htmlFor="periodicidad">Periodicidad</Label>
          <Input
            id="periodicidad"
            className="mt-1.5"
            value={contrato.periodicidad}
            onChange={(e) => set("periodicidad", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="contacto">Contacto del cliente</Label>
          <Input
            id="contacto"
            className="mt-1.5"
            value={contrato.contactoCliente}
            onChange={(e) => set("contactoCliente", e.target.value)}
            placeholder="Nombre, email, teléfono…"
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-semibold">
          Servicios incluidos
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICIO_LABELS.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={contrato.servicios[s.key]}
                onChange={(e) => setServicio(s.key, e.target.checked)}
              />
              <span>
                <span className="font-medium">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {s.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="alcance">Alcance del servicio</Label>
        <textarea
          id="alcance"
          className="mt-1.5 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={contrato.alcance}
          onChange={(e) => set("alcance", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="exclusiones">Exclusiones</Label>
        <textarea
          id="exclusiones"
          className="mt-1.5 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={contrato.exclusiones}
          onChange={(e) => set("exclusiones", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="notas">Notas internas</Label>
        <textarea
          id="notas"
          className="mt-1.5 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={contrato.notasInternas}
          onChange={(e) => set("notasInternas", e.target.value)}
          placeholder="Renovación, liquidación de permisos, incidencias…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="mushroom" disabled={saving} onClick={onSave}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar contrato"}
        </Button>
        {contrato.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Última actualización:{" "}
            {new Date(contrato.updatedAt).toLocaleString("es-ES")}
            {contrato.updatedBy ? ` · ${contrato.updatedBy}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
