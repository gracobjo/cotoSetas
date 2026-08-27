import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ComprarForm } from "@/components/ComprarForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Comprar permiso micológico | Villardeciervos",
  description:
    "Obtén tu permiso digital verificable con QR para recolectar setas en Villardeciervos (PMZA-50.001).",
};

export default function ComprarPage() {
  return (
    <>
      <Header />
      <main className="section-padding">
        <div className="container-narrow">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Comprar permiso
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Completa tus datos, paga la tarifa correspondiente y recibe al
            instante un comprobante con QR por email y en el móvil — como una
            entrada de cine, listo para enseñar al vigilante o SEPRONA.
          </p>
          <div className="mt-8">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando formulario…</p>}>
              <ComprarForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
