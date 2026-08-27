"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidBlock } from "@/components/docs/MermaidBlock";

export function MarkdownDoc({ content }: { content: string }) {
  return (
    <article className="prose-docs max-w-none space-y-4 text-[15px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 font-display text-2xl font-semibold border-b border-border/60 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 font-display text-xl font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              {children}
            </ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline-offset-2 hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b bg-muted/50 px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/50 px-3 py-2 align-top text-muted-foreground">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const text = String(children).replace(/\n$/, "");
            const lang = /language-(\w+)/.exec(className || "")?.[1];
            if (lang === "mermaid") {
              return <MermaidBlock chart={text} />;
            }
            const isBlock = Boolean(className) || text.includes("\n");
            if (isBlock) {
              return (
                <pre className="my-3 overflow-x-auto rounded-md border bg-muted/60 p-3 text-xs">
                  <code>{text}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
                {text}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-mushroom/50 bg-mushroom/5 py-2 pl-4 text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
