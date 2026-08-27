import { listAllPermits, type StoredPermit } from "@/lib/permits";
import {
  listAudit,
  loadUsage,
  sumLastDays,
  type AuditEntry,
} from "@/lib/audit-store";

export type KpiBreakdown = { label: string; count: number; importe: number };

export type AdminStats = {
  generatedAt: string;
  kpis: {
    permisosTotal: number;
    permisosActivos: number;
    permisosRevocados: number;
    permisosCaducados: number;
    ingresosTotal: number;
    ingresosHoy: number;
    ingresos7d: number;
    ingresos30d: number;
    comprasHoy: number;
    compras7d: number;
    compras30d: number;
    ticketMedio: number;
    visitasHoy: number;
    visitas7d: number;
    visitas30d: number;
    verificacionesHoy: number;
    verificaciones7d: number;
    verificaciones30d: number;
  };
  byModalidad: KpiBreakdown[];
  byRecolector: KpiBreakdown[];
  series7d: { day: string; compras: number; ingresos: number; visitas: number }[];
  topPages: { path: string; hits: number }[];
  audit: AuditEntry[];
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isCaducado(p: StoredPermit, now = Date.now()): boolean {
  if (p.status === "revocado") return false;
  return new Date(p.validoHasta).getTime() < now;
}

function effectiveStatus(p: StoredPermit): string {
  if (p.status === "revocado") return "revocado";
  if (isCaducado(p)) return "caducado";
  return p.status === "activo" ? "activo" : p.status;
}

function inLastDays(iso: string, days: number, from = new Date()): boolean {
  const t = new Date(iso).getTime();
  const start = new Date(from);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return t >= start.getTime() && t <= from.getTime() + 86400000;
}

function isToday(iso: string, from = new Date()): boolean {
  return dayKey(new Date(iso)) === dayKey(from);
}

function groupBy(
  permits: StoredPermit[],
  key: (p: StoredPermit) => string
): KpiBreakdown[] {
  const map = new Map<string, KpiBreakdown>();
  for (const p of permits) {
    const label = key(p) || "—";
    const cur = map.get(label) || { label, count: 0, importe: 0 };
    cur.count += 1;
    cur.importe += p.precio || 0;
    map.set(label, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.importe - a.importe);
}

export async function computeAdminStats(auditLimit = 100): Promise<AdminStats> {
  const [permits, usage, audit] = await Promise.all([
    listAllPermits(),
    loadUsage(),
    listAudit(auditLimit),
  ]);

  const now = new Date();
  let activos = 0;
  let revocados = 0;
  let caducados = 0;
  let ingresosTotal = 0;
  let ingresosHoy = 0;
  let ingresos7d = 0;
  let ingresos30d = 0;
  let comprasHoy = 0;
  let compras7d = 0;
  let compras30d = 0;

  const seriesMap = new Map<
    string,
    { day: string; compras: number; ingresos: number; visitas: number }
  >();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    seriesMap.set(key, {
      day: key,
      compras: 0,
      ingresos: 0,
      visitas: usage.visitsByDay[key] || 0,
    });
  }

  for (const p of permits) {
    const st = effectiveStatus(p);
    if (st === "activo") activos += 1;
    else if (st === "revocado") revocados += 1;
    else if (st === "caducado") caducados += 1;

    const precio = p.precio || 0;
    // Ingresos: todas las compras (incluye revocadas como histórico de venta)
    ingresosTotal += precio;

    if (isToday(p.emitidoEn, now)) {
      ingresosHoy += precio;
      comprasHoy += 1;
    }
    if (inLastDays(p.emitidoEn, 7, now)) {
      ingresos7d += precio;
      compras7d += 1;
    }
    if (inLastDays(p.emitidoEn, 30, now)) {
      ingresos30d += precio;
      compras30d += 1;
    }

    const dk = dayKey(new Date(p.emitidoEn));
    const row = seriesMap.get(dk);
    if (row) {
      row.compras += 1;
      row.ingresos += precio;
    }
  }

  const topPages = Object.entries(usage.pageHits)
    .map(([path, hits]) => ({ path, hits }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 8);

  // Si no hay auditoría de compras, sintetizar desde permisos (migración suave)
  let auditOut = audit;
  if (!audit.some((a) => a.action === "compra") && permits.length) {
    auditOut = [
      ...permits.slice(0, auditLimit).map(
        (p): AuditEntry => ({
          id: `synth-${p.id}`,
          at: p.emitidoEn,
          action: "compra",
          permitId: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          email: p.email,
          dniMask: p.dniMask,
          recolector: p.recolector,
          modalidad: p.modalidad,
          precio: p.precio,
          tarifaId: p.tarifaId,
          status: p.status,
          detail: "Reconstruido desde almacén de permisos",
        })
      ),
      ...audit,
    ].slice(0, auditLimit);
  }

  return {
    generatedAt: now.toISOString(),
    kpis: {
      permisosTotal: permits.length,
      permisosActivos: activos,
      permisosRevocados: revocados,
      permisosCaducados: caducados,
      ingresosTotal,
      ingresosHoy,
      ingresos7d,
      ingresos30d,
      comprasHoy,
      compras7d,
      compras30d,
      ticketMedio:
        permits.length > 0
          ? Math.round((ingresosTotal / permits.length) * 100) / 100
          : 0,
      visitasHoy: usage.visitsByDay[dayKey(now)] || 0,
      visitas7d: sumLastDays(usage.visitsByDay, 7, now),
      visitas30d: sumLastDays(usage.visitsByDay, 30, now),
      verificacionesHoy: usage.verifiesByDay[dayKey(now)] || 0,
      verificaciones7d: sumLastDays(usage.verifiesByDay, 7, now),
      verificaciones30d: sumLastDays(usage.verifiesByDay, 30, now),
    },
    byModalidad: groupBy(permits, (p) => p.modalidad),
    byRecolector: groupBy(permits, (p) => p.recolector),
    series7d: Array.from(seriesMap.values()),
    topPages,
    audit: auditOut,
  };
}
