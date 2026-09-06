import { requireAdminSession } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function DocumentacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  requireAdminSession("/documentacion");
  return children;
}
