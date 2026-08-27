import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DocsNav } from "@/components/docs/DocsNav";
import type { DocSlug } from "@/lib/docs-meta";

export function DocsShell({
  children,
  current,
}: {
  children: React.ReactNode;
  current?: DocSlug;
}) {
  return (
    <>
      <Header />
      <main className="section-padding !py-10">
        <div className="container-narrow grid gap-10 lg:grid-cols-[240px_1fr]">
          <DocsNav current={current} />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
