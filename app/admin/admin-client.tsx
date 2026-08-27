"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Tarifa, TarifasConfig } from "@/lib/tarifas-store";
import type { PageContent } from "@/lib/content-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Shield, Search, LayoutDashboard } from "lucide-react";
import { AdminContenidoForm } from "@/components/admin/AdminContenidoForm";
import { AdminStatsPanel } from "@/components/admin/AdminStatsPanel";
import { invalidatePageContentCache } from "@/hooks/use-page-content";

type PermitRow = {
  id: string;
  codigo: string;
  nombre: string;
  email: string;
  dniMask: string;
  recolector: string;
  modalidad: string;
  precio: number;
  status: string;
  emitidoEn: string;
  validoHasta: string;
};

type Tab = "dashboard" | "contenido" | "tarifas" | "permisos";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [config, setConfig] = useState<TarifasConfig | null>(null);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/admin/me");
    if (!res.ok) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setUser(data.user);
  }, [router]);

  const loadTarifas = useCallback(async () => {
    const res = await fetch("/api/admin/tarifas");
    if (!res.ok) return;
    setConfig(await res.json());
  }, []);

  const loadContenido = useCallback(async () => {
    const res = await fetch("/api/admin/contenido");
    if (!res.ok) return;
    setPageContent(await res.json());
  }, []);

  const loadPermisos = useCallback(async (query = "") => {
    const res = await fetch(
      `/api/admin/permisos?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setPermits(data.permits || []);
  }, []);

  useEffect(() => {
    void loadMe().then(() => {
      void loadTarifas();
      void loadContenido();
      void loadPermisos();
    });
  }, [loadMe, loadTarifas, loadContenido, loadPermisos]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const updateTarifa = (id: string, patch: Partial<Tarifa>) => {
    if (!config) return;
    setConfig({
      ...config,
      tarifas: config.tarifas.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    });
  };

  const saveTarifas = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tarifas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notasCampania: config.notasCampania,
          tarifas: config.tarifas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error al guardar",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      setConfig(data.config);
      toast({ title: "Tarifas guardadas" });
    } finally {
      setSaving(false);
    }
  };

  const saveContenido = async () => {
    if (!pageContent) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contenido", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero: pageContent.hero,
          intro: pageContent.intro,
          enlaces: pageContent.enlaces,
          contacto: pageContent.contacto,
          footer: pageContent.footer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error al guardar contenido",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      setPageContent(data.content);
      invalidatePageContentCache();
      toast({ title: "Contenido y enlaces guardados" });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("¿Revocar este permiso?")) return;
    const res = await fetch("/api/admin/permisos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "revocado" }),
    });
    if (!res.ok) {
      toast({ title: "No se pudo revocar", variant: "destructive" });
      return;
    }
    toast({ title: "Permiso revocado" });
    void loadPermisos(q);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-mushroom" />
            <div>
              <h1 className="font-display text-lg font-bold">Panel admin</h1>
              <p className="text-xs text-muted-foreground">
                {user ? `Sesión: ${user}` : "…"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/documentacion">Documentación</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Ver web</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["dashboard", "Dashboard / KPIs"],
              ["contenido", "Contenido / Enlaces"],
              ["tarifas", "Tarifas"],
              ["permisos", "Permisos emitidos"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant={tab === id ? "mushroom" : "outline"}
              size="sm"
              onClick={() => setTab(id)}
            >
              {id === "dashboard" && (
                <LayoutDashboard className="mr-1 h-3.5 w-3.5" />
              )}
              {label}
            </Button>
          ))}
        </div>

        {tab === "dashboard" && <AdminStatsPanel />}

        {tab === "contenido" && pageContent && (
          <AdminContenidoForm
            content={pageContent}
            setContent={setPageContent}
            onSave={saveContenido}
            saving={saving}
          />
        )}

        {tab === "tarifas" && config && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notas">Notas de campaña (públicas)</Label>
              <textarea
                id="notas"
                className="mt-1.5 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={config.notasCampania}
                onChange={(e) =>
                  setConfig({ ...config, notasCampania: e.target.value })
                }
              />
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recolector</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Precio €</TableHead>
                    <TableHead>Kg/día</TableHead>
                    <TableHead>Activa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.tarifas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">
                        {t.recolector}
                        <div className="text-xs text-muted-foreground">
                          {t.tipo}
                          {t.comercial ? " · comercial" : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{t.modalidad}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={t.precio}
                          onChange={(e) =>
                            updateTarifa(t.id, {
                              precio: Number(e.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={t.limiteKg}
                          onChange={(e) => {
                            const kg = Number(e.target.value);
                            updateTarifa(t.id, {
                              limiteKg: kg,
                              limite: `Hasta ${kg} kg por persona y día`,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={t.activa}
                          onChange={(e) =>
                            updateTarifa(t.id, { activa: e.target.checked })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={saveTarifas} variant="mushroom" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar tarifas"}
            </Button>
          </div>
        )}

        {tab === "permisos" && (
          <div className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void loadPermisos(q);
              }}
            >
              <Input
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </form>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Emitido</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        {p.codigo}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{p.nombre}</div>
                        <div className="font-mono text-xs">{p.dniMask}</div>
                      </TableCell>
                      <TableCell className="text-xs">{p.email}</TableCell>
                      <TableCell className="text-xs">{p.modalidad}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "activo" ? "success" : "warning"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(p.emitidoEn).toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {p.status === "activo" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revoke(p.id)}
                          >
                            Revocar
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/verificar/${encodeURIComponent(p.id)}`}>
                            Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!permits.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No hay permisos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
