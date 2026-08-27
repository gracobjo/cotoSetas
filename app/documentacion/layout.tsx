import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function loginRedirectPath(): string {
  const h = headers();
  const path =
    h.get("x-pathname") ||
    h.get("x-invoke-path") ||
    h.get("next-url")?.replace(/^https?:\/\/[^/]+/, "") ||
    "/documentacion";
  return `/admin/login?next=${encodeURIComponent(path.split("?")[0] || "/documentacion")}`;
}

export default function DocumentacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    redirect(loginRedirectPath());
  }

  return children;
}
