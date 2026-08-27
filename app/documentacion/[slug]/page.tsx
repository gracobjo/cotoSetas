import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { DocsShell } from "@/components/docs/DocsShell";
import { MarkdownDoc } from "@/components/docs/MarkdownDoc";
import { DOCS, getDoc, type DocSlug } from "@/lib/docs-meta";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const doc = getDoc(params.slug);
  if (!doc) return { title: "Documentación" };
  return {
    title: `${doc.title} | Documentación`,
    description: doc.description,
  };
}

async function readDoc(file: string): Promise<string> {
  const full = path.join(process.cwd(), "docs", file);
  return fs.readFile(full, "utf8");
}

export default async function DocPage({ params }: Props) {
  const doc = getDoc(params.slug);
  if (!doc) notFound();

  const content = await readDoc(doc.file);

  return (
    <DocsShell current={doc.slug as DocSlug}>
      <MarkdownDoc content={content} />
    </DocsShell>
  );
}
