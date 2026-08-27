import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Hero } from "@/components/Hero";
import { IntroSection } from "@/components/IntroSection";
import { TarifasTable } from "@/components/TarifasTable";
import { EspeciesGrid } from "@/components/EspeciesGrid";
import { RutaSection } from "@/components/RutaSection";
import { BuenasPracticas } from "@/components/BuenasPracticas";
import { ParteMicologico } from "@/components/ParteMicologico";
import { AlertaParte } from "@/components/AlertaParte";
import { EnlacesOficiales } from "@/components/EnlacesOficiales";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <IntroSection />
        <TarifasTable />
        <EspeciesGrid />
        <RutaSection />
        <BuenasPracticas />
        <ParteMicologico />
        <AlertaParte />
        <EnlacesOficiales />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
