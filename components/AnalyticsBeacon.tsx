"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Registra visitas de páginas públicas para KPIs del admin. */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }
    if (last.current === pathname) return;
    last.current = pathname;

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
