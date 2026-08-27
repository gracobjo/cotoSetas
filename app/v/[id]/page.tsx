import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
  searchParams: { s?: string; t?: string };
};

/**
 * URL corta del QR: /v/[id]?s=firma
 * Redirige a la página de verificación completa.
 */
export default function ShortVerifyPage({ params, searchParams }: Props) {
  const id = params.id;
  const sig = searchParams.s || "";
  const t = searchParams.t || "";
  const qs = new URLSearchParams();
  if (sig) qs.set("sig", sig);
  if (t) qs.set("t", t);
  const q = qs.toString();
  redirect(`/verificar/${encodeURIComponent(id)}${q ? `?${q}` : ""}`);
}
