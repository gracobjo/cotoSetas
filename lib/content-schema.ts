import { z } from "zod";

export const officialLinkSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  url: z.string().url().max(500),
  icon: z.enum([
    "Trees",
    "Map",
    "Smartphone",
    "ExternalLink",
    "Globe",
    "Leaf",
    "Link2",
    "BookOpen",
  ]),
  order: z.number().int().min(0).max(999),
  active: z.boolean(),
});

export const pageContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().max(120),
    title: z.string().min(1).max(120),
    subtitle: z.string().max(200),
    description: z.string().max(600),
    backgroundImage: z.string().max(500),
    ctaPrimary: z.string().max(80),
    ctaSecondary: z.string().max(80),
  }),
  intro: z.object({
    title: z.string().min(1).max(160),
    html: z.string().max(20000),
  }),
  enlaces: z.object({
    title: z.string().min(1).max(120),
    subtitle: z.string().max(400),
    secondaryCtaLabel: z.string().max(120),
    secondaryCtaUrl: z
      .string()
      .max(500)
      .refine(
        (v) => v === "" || /^https?:\/\//i.test(v),
        "URL inválida (usa http/https o déjala vacía)"
      ),
    items: z.array(officialLinkSchema).max(30),
  }),
  contacto: z.object({
    whatsappUrl: z.string().max(500),
  }),
  footer: z.object({
    disclaimer: z.string().max(2000),
  }),
});
