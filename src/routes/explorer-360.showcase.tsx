import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Box, Search, Maximize2 } from "lucide-react";
import { ExploreFab } from "@/components/explorer360/ExploreFab";

export const Route = createFileRoute("/explorer-360/showcase")({
  component: ShowcasePage,
  head: () => ({
    meta: [
      { title: "Showcase 3D — Modele interaktive 360°" },
      { name: "description", content: "Eksploro modele 3D interaktive me rotate, zoom dhe fullscreen." },
    ],
  }),
});

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  sketchfab_url: string | null;
  model_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
}

function sketchfabEmbed(url: string): string | null {
  // Accept full embed urls or model page urls
  if (url.includes("/embed")) return url;
  const m = url.match(/sketchfab\.com\/(?:3d-)?models\/([a-zA-Z0-9-]+)/);
  if (m) return `https://sketchfab.com/models/${m[1]}/embed?autostart=1&ui_theme=dark`;
  return null;
}

function ShowcasePage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [active, setActive] = useState<Product | null>(null);

  useEffect(() => {
    supabase
      .from("showcase_products")
      .select("*")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Product[]));
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((p) => p.category && s.add(p.category));
    return ["all", ...Array.from(s)];
  }, [items]);

  const filtered = items.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (q && !`${p.title} ${p.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const embed = active ? sketchfabEmbed(active.sketchfab_url ?? "") : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/explorer-360" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> 360° Explorer
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <Box className="h-5 w-5 text-primary" /> Showcase 3D
          </div>
          <div className="w-20" />
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Modele 3D interaktive</h1>
          <p className="text-muted-foreground">Rrotullo, zoomo dhe inspekto në fullscreen.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko model…" className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)} className="whitespace-nowrap capitalize">
                {c === "all" ? "Të gjitha" : c}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <Box className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold mb-1">Asnjë model ende</h3>
            <p className="text-sm text-muted-foreground">Administratori mund të shtojë modele 3D nga paneli.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="group text-left rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Box className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold">
                    <Maximize2 className="h-5 w-5 mr-2" /> Hap 3D
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    {p.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{p.category}</span>}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setActive(null)}>
          <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="font-bold">{active.title}</div>
              {active.category && <div className="text-xs opacity-70">{active.category}</div>}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActive(null)}>Mbyll</Button>
          </div>
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            {embed ? (
              <iframe
                title={active.title}
                src={embed}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/60">URL e Sketchfab nuk është e vlefshme.</div>
            )}
          </div>
        </div>
      )}

      <ExploreFab />
    </div>
  );
}