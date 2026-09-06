import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompraExitoClient } from "@/components/CompraExitoClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Pago confirmado | Villardeciervos",
  description: "Confirmación de pago y emisión del permiso micológico.",
};

export default function CompraExitoPage() {
  return (
    <>
      <Header />
      <main className="section-padding">
        <div className="container-narrow">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Link>
          </Button>
          <Suspense
            fallback={
              <p className="text-center text-sm text-muted-foreground">
                Confirmando pago…
              </p>
            }
          >
            <CompraExitoClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
