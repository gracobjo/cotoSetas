"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminStats } from "@/lib/admin-stats";
import {
  RefreshCw,
  Euro,
  Ticket,
  Eye,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

function euro(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function actionLabel(action: string) {
  switch (action) {
    case "compra":
      return "Compra";
    case "revocacion":
      return "Revocación";
    case "verificacion":
      return "Verificación";
    case "recuperacion":
      return "Recuperación";
    case "admin_login":
      return "Login admin";
    default:
      return action;
  }
}

function actionVariant(
  action: string
): "success" | "warning" | "secondary" | "outline" {
  if (action === "compra") return "success";
  if (action === "revocacion") return "warning";
  if (action === "admin_login") return "secondary";
  return "outline";
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-mushroom" />
      </CardHeader>
      <CardContent>
        <div className="font-display text-2xl font-bold">{value}</div>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminStatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats?limit=150");
      if (!res.ok) return;
      setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !stats) {
    return (
      <p className="text-sm text-muted-foreground">Cargando indicadores…</p>
    );
  }

  if (!stats) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar las estadísticas.
      </p>
    );
  }

  const { kpis } = stats;
  const maxBar = Math.max(
    1,
    ...stats.series7d.map((d) => Math.max(d.compras, d.visitas))
  );

  const auditRows = stats.audit.filter((a) => {
    if (!auditFilter.trim()) return true;
    const q = auditFilter.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.codigo?.toLowerCase().includes(q) ||
      a.modalidad?.toLowerCase().includes(q) ||
      a.dniMask?.toLowerCase().includes(q) ||
      a.action.includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Dashboard y auditoría</h2>
          <p className="text-sm text-muted-foreground">
            Uso de la aplicación, ingresos y registro de quién compra qué
            permiso. Actualizado{" "}
            {new Date(stats.generatedAt).toLocaleString("es-ES")}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ingresos totales"
          value={euro(kpis.ingresosTotal)}
          hint={`${euro(kpis.ingresos7d)} últimos 7 días · ticket medio ${euro(kpis.ticketMedio)}`}
          icon={Euro}
        />
        <KpiCard
          title="Permisos emitidos"
          value={String(kpis.permisosTotal)}
          hint={`${kpis.permisosActivos} activos · ${kpis.permisosRevocados} revocados · ${kpis.permisosCaducados} caducados`}
          icon={Ticket}
        />
        <KpiCard
          title="Visitas (7 días)"
          value={String(kpis.visitas7d)}
          hint={`${kpis.visitasHoy} hoy · ${kpis.visitas30d} en 30 días`}
          icon={Eye}
        />
        <KpiCard
          title="Verificaciones QR"
          value={String(kpis.verificaciones7d)}
          hint={`${kpis.verificacionesHoy} hoy · ${kpis.verificaciones30d} en 30 días`}
          icon={ShieldCheck}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Compras hoy"
          value={`${kpis.comprasHoy} · ${euro(kpis.ingresosHoy)}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Compras 7 días"
          value={`${kpis.compras7d} · ${euro(kpis.ingresos7d)}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Compras 30 días"
          value={`${kpis.compras30d} · ${euro(kpis.ingresos30d)}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad 7 días</CardTitle>
            <CardDescription>Compras e ingresos · visitas web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.series7d.map((d) => (
              <div key={d.day} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(d.day + "T12:00:00").toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span>
                    {d.compras} compra{d.compras === 1 ? "" : "s"} ·{" "}
                    {euro(d.ingresos)} · {d.visitas} visitas
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-mushroom/80"
                    style={{
                      width: `${(d.compras / maxBar) * 100}%`,
                    }}
                    title="Compras"
                  />
                  <div
                    className="bg-mushroom/30"
                    style={{
                      width: `${(d.visitas / maxBar) * 100}%`,
                    }}
                    title="Visitas"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por modalidad</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modalidad</TableHead>
                    <TableHead className="text-right">N.º</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byModalidad.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell className="text-sm">{r.label}</TableCell>
                      <TableCell className="text-right text-sm">
                        {r.count}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {euro(r.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stats.byModalidad.length && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por tipo de recolector</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recolector</TableHead>
                    <TableHead className="text-right">N.º</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byRecolector.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell className="text-sm">{r.label}</TableCell>
                      <TableCell className="text-right text-sm">
                        {r.count}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {euro(r.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stats.byRecolector.length && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {stats.topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Páginas más visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {stats.topPages.map((p) => (
                <li
                  key={p.path}
                  className="flex justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs">{p.path}</span>
                  <span className="text-muted-foreground">{p.hits}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Auditoría de compras y eventos
            </h3>
            <p className="text-sm text-muted-foreground">
              Quién compró qué permiso, fechas e importes (y revocaciones /
              accesos admin).
            </p>
          </div>
          <input
            className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Filtrar por nombre, email, código…"
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Permiso</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditRows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(a.at).toLocaleString("es-ES")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(a.action)}>
                      {actionLabel(a.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {a.nombre || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.email}
                      {a.dniMask ? ` · ${a.dniMask}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {a.codigo || a.permitId?.slice(0, 12) || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.modalidad || a.detail || "—"}
                    {a.recolector ? (
                      <div className="text-muted-foreground">{a.recolector}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {typeof a.precio === "number" ? euro(a.precio) : "—"}
                  </TableCell>
                  <TableCell>
                    {a.permitId && (
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/verificar/${encodeURIComponent(a.permitId)}`}
                        >
                          Ver
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!auditRows.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Sin eventos de auditoría todavía
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
