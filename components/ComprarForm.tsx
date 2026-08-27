"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, QrCode, Mail, Loader2, Send } from "lucide-react";
import { TARIFAS } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PurchaseResult = {
  ok: boolean;
  permit: {
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
  email: { sent: boolean; mode: string };
  delivery?: {
    email: { sent: boolean; mode: string };
    telegram: { sent: boolean; mode: string; error?: string };
    baseUrl: string;
    warnLocalhost: boolean;
    hint: string | null;
  };
};

export function ComprarForm() {
  const search = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const initialTarifa = search.get("tarifa") || TARIFAS[3]!.id;

  const [tarifaId, setTarifaId] = useState(initialTarifa);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [enviarTelegram, setEnviarTelegram] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(false);

  const tarifa = useMemo(
    () => TARIFAS.find((t) => t.id === tarifaId) || TARIFAS[0]!,
    [tarifaId]
  );

  useEffect(() => {
    const t = search.get("tarifa");
    if (t && TARIFAS.some((x) => x.id === t)) setTarifaId(t);
  }, [search]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enviarEmail && !enviarTelegram) {
      toast({
        title: "Elige un canal de entrega",
        description: "Marca email y/o Telegram",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/permisos/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarifaId,
          nombre,
          email,
          dni,
          aceptaNormativa: acepta,
          enviarEmail,
          enviarTelegram,
          telegramChatId: telegramChatId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "No se pudo completar la compra",
          description: data.error || "Error desconocido",
          variant: "destructive",
        });
        return;
      }

      const result = data as PurchaseResult;
      localStorage.setItem(
        "vdciervos_ultimo_permiso",
        JSON.stringify(result.permit)
      );
      const listRaw = localStorage.getItem("vdciervos_mis_permisos");
      const list = listRaw ? (JSON.parse(listRaw) as unknown[]) : [];
      list.unshift(result.permit);
      localStorage.setItem(
        "vdciervos_mis_permisos",
        JSON.stringify(list.slice(0, 20))
      );

      const parts: string[] = [];
      if (enviarEmail) {
        parts.push(
          result.delivery?.email.mode === "simulated" ||
            result.email.mode === "simulated"
            ? "Email simulado (configura RESEND_API_KEY)"
            : "Email enviado"
        );
      }
      if (enviarTelegram) {
        const tg = result.delivery?.telegram;
        parts.push(
          tg?.sent
            ? "Telegram enviado"
            : `Telegram: ${tg?.error || tg?.mode || "no enviado"}`
        );
      }
      if (result.delivery?.warnLocalhost) {
        parts.push(
          "⚠️ QR con localhost: configura NEXT_PUBLIC_SITE_URL con tu IP LAN"
        );
      }

      toast({
        title: "Permiso emitido",
        description: parts.join(" · "),
      });

      router.push(`/mi-permiso?id=${encodeURIComponent(result.permit.id)}`);
    } catch {
      toast({
        title: "Error de red",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-lg border bg-card p-6 shadow-sm lg:col-span-3"
      >
        <div>
          <Label htmlFor="tarifa">Modalidad</Label>
          <select
            id="tarifa"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={tarifaId}
            onChange={(e) => setTarifaId(e.target.value)}
          >
            {TARIFAS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.recolector} – {t.modalidad} ({t.precio} €)
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1.5"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="dni">DNI / NIE</Label>
          <Input
            id="dni"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="mt-1.5 font-mono uppercase"
            placeholder="12345678A"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Solo se guarda un hash y una máscara (****5678A).
          </p>
        </div>

        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold">
            Entrega del comprobante
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enviarEmail}
              onChange={(e) => setEnviarEmail(e.target.checked)}
            />
            <Mail className="h-4 w-4 text-primary" />
            Enviar por correo electrónico
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enviarTelegram}
              onChange={(e) => setEnviarTelegram(e.target.checked)}
            />
            <Send className="h-4 w-4 text-primary" />
            Enviar por Telegram (bot)
          </label>
          {enviarTelegram && (
            <div>
              <Label htmlFor="tg">Chat ID de Telegram</Label>
              <Input
                id="tg"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="mt-1.5 font-mono"
                placeholder="123456789"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Habla con tu bot (/start) y mira el chat.id en getUpdates. Si
                dejas vacío, se usa TELEGRAM_DEFAULT_CHAT_ID del .env.
              </p>
            </div>
          )}
        </fieldset>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            required
          />
          <span>
            Acepto la normativa del coto y confirmo que los datos son correctos.
            Mostraré el QR y el DNI al vigilante o SEPRONA.
          </span>
        </label>

        <Button
          type="submit"
          variant="mushroom"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Emitiendo permiso…
            </>
          ) : (
            <>Pagar {tarifa.precio} € y obtener permiso</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Pago simulado. Configura email/Telegram en el fichero{" "}
          <code className="rounded bg-muted px-1">.env</code>.
        </p>
      </form>

      <aside className="space-y-4 lg:col-span-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-display text-xl font-semibold">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Recolector</dt>
              <dd className="text-right font-medium">{tarifa.recolector}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Modalidad</dt>
              <dd className="text-right">{tarifa.modalidad}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Límite</dt>
              <dd className="max-w-[60%] text-right text-xs">{tarifa.limite}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-display text-2xl font-bold text-mushroom">
                {tarifa.precio} €
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-5 text-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Seguridad anti-falsificación
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              Firma HMAC-SHA256 + token en el QR
            </li>
            <li className="flex gap-2">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0" />
              Verificación online desde el móvil
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              Entrega por email y/o Telegram
            </li>
          </ul>
          <Badge variant="secondary" className="mt-3">
            Código de seguridad de 8 caracteres
          </Badge>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/mi-permiso">Ya tengo permiso → recuperarlo</Link>
        </Button>
      </aside>
    </div>
  );
}
