"use client";

import { useEffect, useId, useState } from "react";

export function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
        });
        const { svg: rendered } = await mermaid.render(
          `mermaid-${id}-${Math.random().toString(36).slice(2, 8)}`,
          chart
        );
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al renderizar diagrama");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <p className="text-sm text-muted-foreground">Cargando diagrama…</p>
    );
  }

  return (
    <div
      className="my-4 overflow-x-auto rounded-lg border bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
