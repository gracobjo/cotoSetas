"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type VerifyResponse = {
  valid: boolean;
  status?: string;
  error?: string;
  code?: string;
  checkedAt?: string;
  antiForgery?: {
    hmacValid: boolean;
    qrBound: boolean;
    securityCode: string;
  };
  permit?: {
    id: string;
    codigo: string;
    nombre: string;
    dniMask: string;
    recolector: string;
    modalidad: string;
    limite: string;
    precio: number;
    validoDesde: string;
    validoHasta: string;
    parque: string;
    municipio: string;
    emitidoEn: string;
    status?: string;
    firmaPreview: string;
  };
};

const POLL_MS = 12_000;

function VerificarInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const runVerify = useCallback(
    async (opts?: { silent?: boolean }) => {
      const id = params.id;
      if (!id) return;
      const silent = opts?.silent;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const sig = search.get("sig") || "";
        const token = search.get("t") || "";
        const qs = new URLSearchParams();
        qs.set("id", id);
        if (sig) qs.set("sig", sig);
        if (token) qs.set("t", token);
        const res = await fetch(`/api/permisos/verificar?${qs.toString()}`, {
          cache: "no-store",
        });
        setData((await res.json()) as VerifyResponse);
      } catch {
        if (!silent) {
          setData({ valid: false, error: "Error de red al verificar" });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.id, search]
  );

  useEffect(() => {
    void runVerify();
  }, [runVerify]);

  useEffect(() => {
    const tick = () => void runVerify({ silent: true });
    const id = window.setInterval(tick, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    const onFocus = () => tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [runVerify]);

  const revoked = data?.status === "revocado";

  return (
    <main className="section-padding">
      <div className="container-narrow max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Verificación de permiso
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Panel para vigilantes del coto y SEPRONA. El estado se actualiza
              automáticamente (incl. revocaciones).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || refreshing}
            onClick={() => void runVerify({ silent: true })}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {loading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verificando firma…
          </div>
        )}

        {!loading && data && (
          <div className="mt-8 space-y-4">
            {data.valid ? (
              <div className="flex items-start gap-3 rounded-lg border-2 border-emerald-500/40 bg-emerald-500/10 p-5">
                <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-600" />
                <div>
                  <h2 className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    PERMISO VÁLIDO
                  </h2>
                  <p className="mt-1 text-sm">
                    Firma HMAC correcta · QR vinculado · Vigente
                  </p>
                  <Badge variant="success" className="mt-2">
                    {data.status}
                  </Badge>
                </div>
              </div>
            ) : data.code === "BAD_SIGNATURE" ||
              data.code === "QR_MISMATCH" ? (
              <div className="flex items-start gap-3 rounded-lg border-2 border-destructive/40 bg-destructive/10 p-5">
                <ShieldX className="h-8 w-8 shrink-0 text-destructive" />
                <div>
                  <h2 className="font-display text-xl font-bold text-destructive">
                    POSIBLE FALSIFICACIÓN
                  </h2>
                  <p className="mt-1 text-sm">{data.error}</p>
                </div>
              </div>
            ) : (
              <div
                className={`flex items-start gap-3 rounded-lg border-2 p-5 ${
                  revoked
                    ? "border-destructive/50 bg-destructive/10"
                    : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                {revoked ? (
                  <ShieldX className="h-8 w-8 shrink-0 text-destructive" />
                ) : (
                  <ShieldAlert className="h-8 w-8 shrink-0 text-amber-600" />
                )}
                <div>
                  <h2
                    className={`font-display text-xl font-bold ${
                      revoked
                        ? "text-destructive"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {revoked
                      ? "PERMISO REVOCADO"
                      : "NO VÁLIDO / NO VIGENTE"}
                  </h2>
                  <p className="mt-1 text-sm">
                    {revoked
                      ? "Este permiso ha sido anulado por el administrador del coto. No autoriza la recolección."
                      : data.error ||
                        `Estado: ${data.status || "desconocido"}`}
                  </p>
                  {data.status && (
                    <Badge
                      variant={revoked ? "destructive" : "warning"}
                      className="mt-2"
                    >
                      {data.status}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.checkedAt && (
              <p className="text-xs text-muted-foreground">
                Última comprobación:{" "}
                {format(new Date(data.checkedAt), "d MMM yyyy HH:mm:ss", {
                  locale: es,
                })}
                {refreshing ? " · actualizando…" : ""}
              </p>
            )}

            {data.permit && (
              <div className="rounded-lg border bg-card p-5 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Código</dt>
                    <dd className="font-mono font-bold tracking-wider">
                      {data.permit.codigo}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Titular</dt>
                    <dd className="font-medium">{data.permit.nombre}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">DNI</dt>
                    <dd className="font-mono">{data.permit.dniMask}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Modalidad</dt>
                    <dd>{data.permit.modalidad}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Límite</dt>
                    <dd className="max-w-[55%] text-right text-xs">
                      {data.permit.limite}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Vigencia</dt>
                    <dd className="text-right text-xs">
                      {format(
                        new Date(data.permit.validoDesde),
                        "d MMM yy HH:mm",
                        { locale: es }
                      )}{" "}
                      →{" "}
                      {format(
                        new Date(data.permit.validoHasta),
                        "d MMM yy HH:mm",
                        { locale: es }
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t pt-2">
                    <dt className="text-muted-foreground">Firma</dt>
                    <dd className="font-mono text-[10px]">
                      {data.permit.firmaPreview}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-muted-foreground">
                  Contrasta el DNI físico con la máscara mostrada. El documento
                  debe coincidir con el titular presente.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerificarPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="section-padding">
            <p className="container-narrow text-muted-foreground">
              Cargando verificación…
            </p>
          </main>
        }
      >
        <VerificarInner />
      </Suspense>
      <Footer />
    </>
  );
}
