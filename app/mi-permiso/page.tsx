"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PermitTicket, type TicketData } from "@/components/PermitTicket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Smartphone, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POLL_MS = 15_000;

function extractSig(verifyUrl?: string): string {
  if (!verifyUrl) return "";
  try {
    const u = new URL(verifyUrl, "http://local");
    return u.searchParams.get("s") || u.searchParams.get("sig") || "";
  } catch {
    return "";
  }
}

function persistPermit(p: TicketData) {
  localStorage.setItem("vdciervos_ultimo_permiso", JSON.stringify(p));
  const listRaw = localStorage.getItem("vdciervos_mis_permisos");
  const list = listRaw ? (JSON.parse(listRaw) as TicketData[]) : [];
  const next = [p, ...list.filter((x) => x.id !== p.id)].slice(0, 20);
  localStorage.setItem("vdciervos_mis_permisos", JSON.stringify(next));
}

function MiPermisoInner() {
  const search = useSearchParams();
  const { toast } = useToast();
  const [permit, setPermit] = useState<TicketData | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    const id = search.get("id");
    try {
      const raw = localStorage.getItem("vdciervos_ultimo_permiso");
      if (raw) {
        const p = JSON.parse(raw) as TicketData;
        if (!id || p.id === id) {
          setPermit(p);
          return;
        }
      }
      if (id) {
        const listRaw = localStorage.getItem("vdciervos_mis_permisos");
        if (listRaw) {
          const list = JSON.parse(listRaw) as TicketData[];
          const found = list.find((x) => x.id === id);
          if (found) setPermit(found);
        }
      }
    } catch {
      /* ignore */
    }
  }, [search]);

  const refreshStatus = useCallback(async (p: TicketData) => {
    try {
      const qs = new URLSearchParams({ id: p.id });
      const sig = extractSig(p.verifyUrl);
      if (sig) qs.set("sig", sig);
      const res = await fetch(`/api/permisos/verificar?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data?.status && data?.valid === undefined) return;

      const nextStatus: string =
        data.status ||
        (data.valid ? "activo" : "caducado");

      setStatusNote(
        data.checkedAt
          ? `Estado en servidor comprobado a las ${new Date(
              data.checkedAt
            ).toLocaleTimeString("es-ES")}`
          : null
      );

      if (nextStatus !== p.status) {
        const updated = { ...p, status: nextStatus };
        setPermit(updated);
        persistPermit(updated);
      }
    } catch {
      /* red: mantener ticket local */
    }
  }, []);

  useEffect(() => {
    if (!permit?.id) return;
    void refreshStatus(permit);
    const tick = () => void refreshStatus(permit);
    const id = window.setInterval(tick, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
    };
    // Solo re-suscribir al cambiar de permiso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permit?.id, refreshStatus]);

  const recuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/permisos/recuperar?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!data.permits?.length) {
        toast({
          title: "Sin resultados",
          description: "No hay permisos en el servidor para ese email.",
          variant: "destructive",
        });
        return;
      }
      const first = data.permits[0] as TicketData;
      setPermit(first);
      persistPermit(first);
      toast({
        title: "QR actualizado",
        description: "Escanea el nuevo código (URL corta, más legible).",
      });
    } catch {
      toast({ title: "Error al recuperar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const revoked = permit?.status === "revocado";

  return (
    <main className="section-padding">
      <div className="container-narrow max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="mb-6 flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-mushroom" />
          <h1 className="font-display text-3xl font-bold">Mi permiso</h1>
        </div>
        <p className="mb-8 text-muted-foreground">
          Muestra esta pantalla al vigilante del coto o SEPRONA. El estado se
          comprueba en el servidor (si el admin revoca el permiso, dejará de
          figurar como válido).
        </p>

        {permit ? (
          <div className="space-y-4">
            {revoked && (
              <div className="flex items-start gap-3 rounded-lg border-2 border-destructive/50 bg-destructive/10 p-4">
                <ShieldX className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
                <div>
                  <p className="font-display text-lg font-bold text-destructive">
                    Permiso revocado
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El administrador del coto ha anulado este permiso. El QR ya
                    no pasa la verificación online.
                  </p>
                </div>
              </div>
            )}
            <PermitTicket permit={permit} />
            {statusNote && (
              <p className="text-xs text-muted-foreground">{statusNote}</p>
            )}
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
              <p className="text-muted-foreground">
                Si el QR no se lee con el móvil, regenera uno corto y más
                grande (misma compra):
              </p>
              <form
                onSubmit={recuperar}
                className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <Label htmlFor="rec-email">Email de compra</Label>
                  <Input
                    id="rec-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    required
                    placeholder="el mismo que usaste al comprar"
                  />
                </div>
                <Button type="submit" variant="mushroom" disabled={loading}>
                  {loading ? "Actualizando…" : "Actualizar QR"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <form
            onSubmit={recuperar}
            className="space-y-4 rounded-lg border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground">
              No hay permiso guardado en este dispositivo. Introdúcelo por
              email:
            </p>
            <div>
              <Label htmlFor="rec-email">Email de compra</Label>
              <Input
                id="rec-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <Button type="submit" variant="mushroom" disabled={loading}>
              {loading ? "Buscando…" : "Recuperar permiso"}
            </Button>
            <Button asChild variant="outline" className="ml-2">
              <Link href="/comprar">Comprar nuevo</Link>
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function MiPermisoPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="section-padding">
            <p className="container-narrow text-muted-foreground">Cargando…</p>
          </main>
        }
      >
        <MiPermisoInner />
      </Suspense>
      <Footer />
    </>
  );
}
