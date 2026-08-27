"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, TreePine } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#permisos", label: "Permisos" },
  { href: "/#especies", label: "Especies" },
  { href: "/#rutas", label: "Rutas" },
  { href: "/#parte", label: "Parte Micológico" },
  { href: "/#alertas", label: "Alertas" },
  { href: "/#contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container-narrow flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/#inicio"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-forest dark:text-primary"
        >
          <TreePine className="h-6 w-6 text-mushroom" aria-hidden />
          <span className="hidden sm:inline">Villardeciervos</span>
          <span className="sm:hidden">VdC</span>
          <span className="text-sm font-sans font-normal text-muted-foreground">
            Micología
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="mushroom" size="sm" className="hidden md:inline-flex">
            <Link href="/comprar">Comprar permiso</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border/60 bg-background lg:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="container-narrow flex flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="mushroom" className="mt-2">
            <Link href="/comprar" onClick={() => setOpen(false)}>
              Comprar permiso
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
