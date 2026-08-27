"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellRing, CheckCircle2, Mail, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LINKS } from "@/lib/content";
import { useToast } from "@/hooks/use-toast";

const LS_ALERT = "vdciervos_alerta_parte";
const LS_EMAIL = "vdciervos_alerta_email";
const LS_PARTE_DETECTADO = "vdciervos_parte_detectado";

type AlertState = {
  active: boolean;
  since?: string;
};

export function AlertaParte() {
  const { toast } = useToast();
  const [alertState, setAlertState] = useState<AlertState>({ active: false });
  const [email, setEmail] = useState("");
  const [parteDetectado, setParteDetectado] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ALERT);
      if (raw) setAlertState(JSON.parse(raw) as AlertState);
      const em = localStorage.getItem(LS_EMAIL);
      if (em) setEmail(em);
      if (localStorage.getItem(LS_PARTE_DETECTADO) === "1") {
        setParteDetectado(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistAlert = (state: AlertState) => {
    setAlertState(state);
    localStorage.setItem(LS_ALERT, JSON.stringify(state));
  };

  const activarSeguimiento = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast({
          title: "Permiso denegado",
          description:
            "Puedes activar las notificaciones del navegador más tarde. El seguimiento local seguirá activo.",
          variant: "destructive",
        });
      }
    }

    persistAlert({ active: true, since: new Date().toISOString() });
    toast({
      title: "Seguimiento activado",
      description:
        "Te avisaremos cuando se publique el primer parte de otoño.",
    });
  };

  const desactivar = () => {
    persistAlert({ active: false });
    localStorage.removeItem(LS_PARTE_DETECTADO);
    setParteDetectado(false);
    toast({ title: "Seguimiento desactivado" });
  };

  const suscribirEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({
        title: "Email no válido",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem(LS_EMAIL, email.trim().toLowerCase());
    // Producción: enviar a Formspree / EmailJS / Resend
    // await fetch("https://formspree.io/f/TU_ID", { method: "POST", body: JSON.stringify({ email }) })
    toast({
      title: "Suscripción guardada",
      description:
        "Email almacenado localmente. Conecta Formspree/Resend en producción (ver README).",
    });
  };

  /** Simulación de comprobación periódica de noticias Micocyl */
  const comprobarParte = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/alerta/check");
      const data = (await res.json()) as {
        detected: boolean;
        title?: string;
        url?: string;
      };

      if (data.detected) {
        localStorage.setItem(LS_PARTE_DETECTADO, "1");
        setParteDetectado(true);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Primer parte micológico de otoño", {
            body:
              data.title ||
              "Micocyl ha publicado información del parte de otoño en Zamora.",
            icon: "/favicon.ico",
          });
        }

        toast({
          title: "¡Parte detectado!",
          description: data.title || "Se ha publicado el primer parte.",
        });
      } else {
        toast({
          title: "Sin novedades",
          description:
            "Aún no hay parte de otoño. Seguiremos comprobando (simulación).",
        });
      }
    } catch {
      toast({
        title: "Error al comprobar",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  }, [toast]);

  // Comprobación periódica cada 5 min si el seguimiento está activo
  useEffect(() => {
    if (!alertState.active) return;
    const id = setInterval(() => {
      void comprobarParte();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [alertState.active, comprobarParte]);

  return (
    <section id="alertas" className="section-padding">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-2xl"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Alerta del primer parte
          </h2>
          <p className="mt-3 text-muted-foreground">
            Activa el seguimiento del primer parte oficial de otoño en Zamora y
            recibe aviso en el navegador cuando Micocyl lo publique.
          </p>
        </motion.div>

        {alertState.active && !parteDetectado && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
            <BellRing className="h-5 w-5 shrink-0 animate-pulse-soft text-primary" />
            <span>
              Seguimiento activo – te avisaremos cuando Micocyl publique el
              primer parte de otoño.
            </span>
            <Badge variant="success" className="ml-auto hidden sm:inline-flex">
              Activo
            </Badge>
          </div>
        )}

        {parteDetectado && (
          <div className="mb-6 rounded-lg border-2 border-mushroom bg-mushroom/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Newspaper className="mt-0.5 h-7 w-7 shrink-0 text-mushroom" />
                <div>
                  <h3 className="font-display text-xl font-bold">
                    ¡Primer parte de otoño disponible!
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se ha detectado publicación relevante en Micocyl. Consulta
                    el parte oficial.
                  </p>
                </div>
              </div>
              <Button asChild variant="mushroom">
                <a
                  href={LINKS.micocyl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver parte oficial
                </a>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notificaciones del navegador</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Pediremos permiso de notificaciones y guardaremos tu preferencia
              en este dispositivo (localStorage).
            </p>
            <div className="flex flex-wrap gap-2">
              {!alertState.active ? (
                <Button onClick={activarSeguimiento} variant="mushroom">
                  Activar seguimiento del primer parte oficial de otoño en
                  Zamora
                </Button>
              ) : (
                <>
                  <Button onClick={comprobarParte} disabled={checking}>
                    {checking ? "Comprobando…" : "Comprobar ahora"}
                  </Button>
                  <Button variant="outline" onClick={desactivar}>
                    Desactivar
                  </Button>
                </>
              )}
            </div>
            {/* Demo: forzar detección para probar UI */}
            <button
              type="button"
              className="mt-4 text-xs text-muted-foreground underline"
              onClick={() => {
                localStorage.setItem(LS_PARTE_DETECTADO, "1");
                setParteDetectado(true);
                if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("Demo: primer parte micológico", {
                    body: "Simulación de detección del parte de otoño.",
                  });
                }
              }}
            >
              Simular detección del parte (demo)
            </button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Suscripción por email</h3>
            </div>
            <form onSubmit={suscribirEmail} className="space-y-3">
              <div>
                <Label htmlFor="alerta-email">Correo electrónico</Label>
                <Input
                  id="alerta-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <CheckCircle2 className="h-4 w-4" />
                Suscribirme al aviso
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              {/* Cómo conectar en producción:
                  - Formspree: POST a https://formspree.io/f/XXXX
                  - EmailJS: emailjs.send(...)
                  - Resend: API /api/subscribe con RESEND_API_KEY
              */}
              Guarda el email en localStorage. En producción conéctalo a
              Formspree, EmailJS o Resend (instrucciones en el README).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
