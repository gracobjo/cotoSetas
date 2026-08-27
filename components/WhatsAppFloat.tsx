"use client";

import { MessageCircle } from "lucide-react";
import { usePageContent } from "@/hooks/use-page-content";

export function WhatsAppFloat() {
  const { content } = usePageContent();
  const href =
    content?.contacto.whatsappUrl ||
    "https://wa.me/34644386025?text=Hola%20consulta%20permisos";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
