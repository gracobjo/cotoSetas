"use client";

import { motion } from "framer-motion";
import {
  ExternalLink,
  Smartphone,
  Map,
  Trees,
  Globe,
  Leaf,
  Link2,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/use-page-content";
import type { LinkIcon } from "@/lib/content-store";

const ICONS: Record<LinkIcon, LucideIcon> = {
  Trees,
  Map,
  Smartphone,
  ExternalLink,
  Globe,
  Leaf,
  Link2,
  BookOpen,
};

export function EnlacesOficiales() {
  const { content } = usePageContent();
  const section = content?.enlaces;
  const items = section?.items || [];

  return (
    <section className="section-padding bg-muted/40">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {section?.title || "Enlaces oficiales"}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {section?.subtitle ||
              "Recursos oficiales de Micocyl y del territorio."}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((e, i) => {
            const Icon = ICONS[e.icon] || ExternalLink;
            return (
              <motion.a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.a>
            );
          })}
        </div>

        {section?.secondaryCtaUrl && section.secondaryCtaLabel && (
          <div className="mt-6">
            <Button asChild variant="outline">
              <a
                href={section.secondaryCtaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {section.secondaryCtaLabel}
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
