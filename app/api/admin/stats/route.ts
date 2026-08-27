import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { computeAdminStats } from "@/lib/admin-stats";

/** GET /api/admin/stats — KPIs de uso + auditoría de compras */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 100) || 100,
    500
  );

  const stats = await computeAdminStats(limit);
  return NextResponse.json(stats);
}
