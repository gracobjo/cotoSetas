"use client";

import { MessageCircle } from "lucide-react";
import { LINKS } from "@/lib/content";
import { usePageContent } from "@/hooks/use-page-content";

export function WhatsAppFloat() {
  const { content } = usePageContent();
  const href =
    process.env.NEXT_PUBLIC_WHATSAPP_URL ||
    content?.contacto.whatsappUrl ||
    LINKS.whatsapp;

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
