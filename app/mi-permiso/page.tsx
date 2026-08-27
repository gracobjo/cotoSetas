"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PermitTicket, type TicketData } from "@/components/PermitTicket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function MiPermisoInner() {
  const search = useSearchParams();
  const { toast } = useToast();
  const [permit, setPermit] = useState<TicketData | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = search.get("id");
    try {
      const raw = localStorage.getItem("vdciervos_ultimo_permiso");
      if (raw) {
        const p = JSON.parse(raw) as TicketData;
        if (!id || p.id === id) setPermit(p);
      }
      if (!permit && id) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
          description:
            "No hay permisos en el servidor para ese email (en demo el almacén es en memoria).",
          variant: "destructive",
        });
        return;
      }
      const first = data.permits[0] as TicketData;
      setPermit(first);
      localStorage.setItem("vdciervos_ultimo_permiso", JSON.stringify(first));
      toast({ title: "Permiso recuperado" });
    } catch {
      toast({ title: "Error al recuperar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
          Muestra esta pantalla al vigilante del coto o SEPRONA. El QR abre la
          verificación online con firma digital.
        </p>

        {permit ? (
          <PermitTicket permit={permit} />
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
      <Suspense fallback={<main className="section-padding"><p className="container-narrow text-muted-foreground">Cargando…</p></main>}>
        <MiPermisoInner />
      </Suspense>
      <Footer />
    </>
  );
}
