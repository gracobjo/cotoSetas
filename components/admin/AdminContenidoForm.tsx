"use client";

import type { OfficialLink, PageContent, LinkIcon } from "@/lib/content-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";

const ICON_OPTIONS: LinkIcon[] = [
  "Trees",
  "Map",
  "Smartphone",
  "ExternalLink",
  "Globe",
  "Leaf",
  "Link2",
  "BookOpen",
];

export function AdminContenidoForm({
  content,
  setContent,
  onSave,
  saving,
}: {
  content: PageContent;
  setContent: (c: PageContent) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const updateHero = (patch: Partial<PageContent["hero"]>) =>
    setContent({ ...content, hero: { ...content.hero, ...patch } });

  const updateLink = (id: string, patch: Partial<OfficialLink>) => {
    setContent({
      ...content,
      enlaces: {
        ...content.enlaces,
        items: content.enlaces.items.map((i) =>
          i.id === id ? { ...i, ...patch } : i
        ),
      },
    });
  };

  const addLink = () => {
    const id = `link-${Date.now().toString(36)}`;
    const maxOrder = content.enlaces.items.reduce(
      (m, i) => Math.max(m, i.order),
      0
    );
    setContent({
      ...content,
      enlaces: {
        ...content.enlaces,
        items: [
          ...content.enlaces.items,
          {
            id,
            title: "Nuevo enlace",
            description: "Descripción del recurso",
            url: "https://example.com",
            icon: "Globe",
            order: maxOrder + 1,
            active: true,
          },
        ],
      },
    });
  };

  const removeLink = (id: string) => {
    if (!confirm("¿Eliminar este enlace?")) return;
    setContent({
      ...content,
      enlaces: {
        ...content.enlaces,
        items: content.enlaces.items.filter((i) => i.id !== id),
      },
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-display text-lg font-semibold">Hero (portada)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Eyebrow</Label>
            <Input
              className="mt-1"
              value={content.hero.eyebrow}
              onChange={(e) => updateHero({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label>Título</Label>
            <Input
              className="mt-1"
              value={content.hero.title}
              onChange={(e) => updateHero({ title: e.target.value })}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              className="mt-1"
              value={content.hero.subtitle}
              onChange={(e) => updateHero({ subtitle: e.target.value })}
            />
          </div>
          <div>
            <Label>Imagen de fondo (URL)</Label>
            <Input
              className="mt-1"
              value={content.hero.backgroundImage}
              onChange={(e) => updateHero({ backgroundImage: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Descripción</Label>
          <textarea
            className="mt-1 min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={content.hero.description}
            onChange={(e) => updateHero({ description: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>CTA principal</Label>
            <Input
              className="mt-1"
              value={content.hero.ctaPrimary}
              onChange={(e) => updateHero({ ctaPrimary: e.target.value })}
            />
          </div>
          <div>
            <Label>CTA secundario</Label>
            <Input
              className="mt-1"
              value={content.hero.ctaSecondary}
              onChange={(e) => updateHero({ ctaSecondary: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-display text-lg font-semibold">Introducción</h2>
        <div>
          <Label>Título</Label>
          <Input
            className="mt-1"
            value={content.intro.title}
            onChange={(e) =>
              setContent({
                ...content,
                intro: { ...content.intro, title: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label>HTML (p, br, strong, em, a, ul, ol, li)</Label>
          <textarea
            className="mt-1 min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            value={content.intro.html}
            onChange={(e) =>
              setContent({
                ...content,
                intro: { ...content.intro, html: e.target.value },
              })
            }
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Enlaces oficiales (CRUD)
          </h2>
          <Button type="button" size="sm" variant="outline" onClick={addLink}>
            <Plus className="h-4 w-4" />
            Añadir
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Título sección</Label>
            <Input
              className="mt-1"
              value={content.enlaces.title}
              onChange={(e) =>
                setContent({
                  ...content,
                  enlaces: { ...content.enlaces, title: e.target.value },
                })
              }
            />
          </div>
          <div>
            <Label>CTA secundario (etiqueta)</Label>
            <Input
              className="mt-1"
              value={content.enlaces.secondaryCtaLabel}
              onChange={(e) =>
                setContent({
                  ...content,
                  enlaces: {
                    ...content.enlaces,
                    secondaryCtaLabel: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
        <div>
          <Label>Subtítulo sección</Label>
          <Input
            className="mt-1"
            value={content.enlaces.subtitle}
            onChange={(e) =>
              setContent({
                ...content,
                enlaces: { ...content.enlaces, subtitle: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label>URL CTA secundario</Label>
          <Input
            className="mt-1"
            value={content.enlaces.secondaryCtaUrl}
            onChange={(e) =>
              setContent({
                ...content,
                enlaces: {
                  ...content.enlaces,
                  secondaryCtaUrl: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="space-y-4">
          {content.enlaces.items
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-2"
              >
                <div>
                  <Label>Título</Label>
                  <Input
                    className="mt-1"
                    value={item.title}
                    onChange={(e) =>
                      updateLink(item.id, { title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    className="mt-1"
                    value={item.url}
                    onChange={(e) =>
                      updateLink(item.id, { url: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descripción</Label>
                  <Input
                    className="mt-1"
                    value={item.description}
                    onChange={(e) =>
                      updateLink(item.id, { description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Icono</Label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={item.icon}
                    onChange={(e) =>
                      updateLink(item.id, {
                        icon: e.target.value as LinkIcon,
                      })
                    }
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      value={item.order}
                      onChange={(e) =>
                        updateLink(item.id, {
                          order: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) =>
                        updateLink(item.id, { active: e.target.checked })
                      }
                    />
                    Activo
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => removeLink(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-display text-lg font-semibold">Contacto / Footer</h2>
        <div>
          <Label>WhatsApp URL</Label>
          <Input
            className="mt-1"
            value={content.contacto.whatsappUrl}
            onChange={(e) =>
              setContent({
                ...content,
                contacto: { whatsappUrl: e.target.value },
              })
            }
          />
        </div>
        <div>
          <Label>Disclaimer pie de página</Label>
          <textarea
            className="mt-1 min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={content.footer.disclaimer}
            onChange={(e) =>
              setContent({
                ...content,
                footer: { disclaimer: e.target.value },
              })
            }
          />
        </div>
      </section>

      <Button onClick={onSave} variant="mushroom" disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Guardando…" : "Guardar contenido y enlaces"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Actualizado: {new Date(content.updatedAt).toLocaleString("es-ES")}
        {content.updatedBy ? ` · ${content.updatedBy}` : ""}
      </p>
    </div>
  );
}
