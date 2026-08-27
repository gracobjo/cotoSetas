import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function DocumentacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    redirect("/");
  }

  return children;
}
