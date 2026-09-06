import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

/** Redirige a login si no hay sesión admin válida. */
export function requireAdminSession(returnPath = "/documentacion"): void {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    redirect(
      `/admin/login?next=${encodeURIComponent(returnPath.split("?")[0])}`
    );
  }
}
