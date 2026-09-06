"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PermitLite = {
  id: string;
  codigo: string;
  qrDataUrl?: string;
  verifyUrl: string;
  email: string;
  nombre: string;
  modalidad: string;
  precio: number;
  dniMask: string;
  validoDesde: string;
  validoHasta: string;
};

export function CompraExitoClient() {
  const search = useSearchParams();
  const router = useRouter();
  const sessionId = search.get("session_id");
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError("Falta el identificador de la sesión de pago.");
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const poll = async () => {
      attempt += 1;
      if (!cancelled) setTries(attempt);
      try {
        const res = await fetch(
          `/api/permisos/por-sesion?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await res.json();

        if (res.status === 202 || res.status === 402) {
          if (attempt < 12 && !cancelled) {
            setTimeout(poll, 1500);
          } else if (!cancelled) {
            setError(
              data.error ||
                "El pago se está confirmando. Revisa tu email o Mi permiso en unos minutos."
            );
          }
          return;
        }

        if (!res.ok || !data.permit) {
          if (!cancelled) {
            setError(data.error || "No se pudo obtener el permiso");
          }
          return;
        }

        const permit = data.permit as PermitLite;
        localStorage.setItem(
          "vdciervos_ultimo_permiso",
          JSON.stringify(permit)
        );
        const listRaw = localStorage.getItem("vdciervos_mis_permisos");
        const list = listRaw ? (JSON.parse(listRaw) as unknown[]) : [];
        list.unshift(permit);
        localStorage.setItem(
          "vdciervos_mis_permisos",
          JSON.stringify(list.slice(0, 20))
        );

        if (!cancelled) {
          router.replace(`/mi-permiso?id=${encodeURIComponent(permit.id)}`);
        }
      } catch {
        if (attempt < 8 && !cancelled) {
          setTimeout(poll, 2000);
        } else if (!cancelled) {
          setError("Error de red al confirmar el pago.");
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          No se pudo confirmar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="mushroom">
            <Link href="/mi-permiso">Ir a Mi permiso</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/comprar">Volver a comprar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-bold">Pago recibido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Estamos emitiendo tu permiso digital con QR…
      </p>
      <Loader2 className="mx-auto mt-6 h-8 w-8 animate-spin text-mushroom" />
      <p className="mt-3 text-xs text-muted-foreground">
        Intento {tries || 1}…
      </p>
    </div>
  );
}
