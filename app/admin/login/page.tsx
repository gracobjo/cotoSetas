import { Suspense } from "react";
import AdminLoginPage from "./login-client";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground">Cargando…</main>}>
      <AdminLoginPage />
    </Suspense>
  );
}
