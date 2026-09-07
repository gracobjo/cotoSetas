import { NextResponse } from "next/server";
import {
  getTarifasConfig,
  getTarifasActivas,
  GUIA_TIPOS_PERMISO,
} from "@/lib/tarifas-store";

/** GET /api/tarifas — listado público de tarifas activas */
export async function GET() {
  const [activas, config] = await Promise.all([
    getTarifasActivas(),
    getTarifasConfig(),
  ]);
  return NextResponse.json({
    notasCampania: config.notasCampania,
    updatedAt: config.updatedAt,
    tarifas: activas,
    guiaTipos: GUIA_TIPOS_PERMISO,
  });
}
