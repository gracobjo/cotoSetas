"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error de acceso");
        return;
      }
      const next = search.get("next") || "/admin";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-forest-pattern px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-lg"
      >
        <div className="flex items-center gap-2 text-forest dark:text-primary">
          <TreePine className="h-6 w-6 text-mushroom" />
          <h1 className="font-display text-xl font-bold">Admin coto</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Acceso restringido. Sesión httpOnly firmada (OWASP).
        </p>
        <div>
          <Label htmlFor="user">Usuario</Label>
          <Input
            id="user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <Label htmlFor="pass">Contraseña</Label>
          <Input
            id="pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="mushroom" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </main>
  );
}
