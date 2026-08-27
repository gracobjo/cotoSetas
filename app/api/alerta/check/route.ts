import { NextResponse } from "next/server";

/**
 * GET /api/alerta/check
 *
 * Simula (y deja listo para producción) la comprobación del primer parte
 * micológico de otoño en Micocyl.
 *
 * Producción recomendada:
 * - Cron de Vercel (cada hora) o servicio externo (Cron-job.org)
 * - Fetch a la API/noticias de Micocyl o RSS
 * - Comparar con keywords: "parte", "otoño", "Zamora", "PMZA"
 * - Si detecta novedad: push (Web Push / OneSignal) + email a suscriptores
 *
 * Variables:
 * - FORCE_PARTE_DETECTADO=true  → fuerza detección (tests)
 * - MICOCYL_NEWS_URL            → URL a scrapear/consultar
 */
export async function GET() {
  if (process.env.FORCE_PARTE_DETECTADO === "true") {
    return NextResponse.json({
      detected: true,
      title: "Parte micológico de otoño – Noroeste Zamorano",
      url: "https://www.micocyl.es/",
      source: "force-env",
    });
  }

  // Simulación: aún no es temporada (agosto 2026)
  // En septiembre/octubre, un cron podría marcar detected=true
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const newsUrl = process.env.MICOCYL_NEWS_URL || "https://www.micocyl.es/";

  // Placeholder de integración real:
  // const html = await fetch(newsUrl).then(r => r.text())
  // const detected = /parte.*(otoño|otono).*zamora/i.test(html)

  const detected = false;

  return NextResponse.json({
    detected,
    checkedAt: now.toISOString(),
    month,
    note:
      month >= 8
        ? "Temporada de seguimiento activa (sept–nov). Conecta el scraper/API real."
        : "Fuera de ventana típica de primer parte de otoño.",
    url: newsUrl,
    source: "simulation",
  });
}
