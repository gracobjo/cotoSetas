"use client";

import { useEffect, useState } from "react";
import type { PageContent } from "@/lib/content-store";

let cache: PageContent | null = null;
let inflight: Promise<PageContent> | null = null;

async function fetchContent(): Promise<PageContent> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/contenido")
      .then((r) => r.json())
      .then((data: PageContent) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function usePageContent() {
  const [content, setContent] = useState<PageContent | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    void fetchContent().then((data) => {
      if (alive) {
        setContent(data);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { content, loading };
}

/** Invalida caché tras guardar en admin (recarga siguiente visita). */
export function invalidatePageContentCache() {
  cache = null;
}
