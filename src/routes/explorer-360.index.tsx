import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe2, MapPin, Search, ArrowLeft, Sparkles, Box } from "lucide-react";
import { ToursMap, type TourPin } from "@/components/explorer360/ToursMap";
import { ExploreFab } from "@/components/explorer360/ExploreFab";
import { AiGuide } from "@/components/explorer360/AiGuide";

export const Route = createFileRoute("/explorer-360/")({
  component: ExplorerHub,
  head: () => ({
    meta: [
      { title: "360° Explorer — Tour-e virtuale dhe Showcase 3D" },
      { name: "description", content: "Eksploro vende me panorama 360°, modele 3D dhe tour-e immersive me VR." },
      { property: "og:title", content: "360° Explorer" },
      { property: "og:description", content: "Tour-e 360°, showcase 3D dhe pamje VR — gjithçka në një vend." },
    ],
  }),
});

interface TourRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
  featured: boolean;
}

function ExplorerHub() {
  const [tours, setTours] = useState<TourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("tours")
      .select("id,slug,title,description,cover_url,category,lat,lng,featured")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTours((data ?? []) as TourRow[]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    tours.forEach((t) => t.category && s.add(t.category));
    return ["all", ...Array.from(s)];
  }, [tours]);

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (q.trim() && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tours, q, cat]);

  const pins: TourPin[] = filtered
    .filter((t) => t.lat != null && t.lng != null)
    .map((t) => ({ id: t.id, slug: t.slug, title: t.title, category: t.category, lat: t.lat!, lng: t.lng! }));

  const featured = filtered.filter((t) => t.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kthehu
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <Globe2 className="h-5 w-5 text-primary" /> 360° Explorer
          </div>
          <Link to="/explorer-360/showcase">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Box className="h-4 w-4" /> <span className="hidden sm:inline">Showcase 3D</span>
            </Button>
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Tour-e virtuale 360°
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">Eksploro botën në 360°</h1>
          <p className="text-muted-foreground">Panorama immersive, hotspots, VR mode dhe showcase 3D.</p>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {featured.map((t) => (
              <Link
                key={t.id}
                to="/explorer-360/tour/$slug"
                params={{ slug: t.slug }}
                className="group relative h-56 rounded-2xl overflow-hidden border shadow-lg"
              >
                {t.cover_url ? (
                  <img src={t.cover_url} alt={t.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase">Featured</div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="font-bold text-lg">{t.title}</div>
                  {t.category && <div className="text-xs opacity-80">{t.category}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko tour…" className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "default" : "outline"}
                onClick={() => setCat(c)}
                className="whitespace-nowrap capitalize"
              >
                {c === "all" ? "Të gjitha" : c}
              </Button>
            ))}
          </div>
        </div>

        {/* Map */}
        {pins.length > 0 && (
          <div className="mb-8">
            <ToursMap pins={pins} />
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Duke ngarkuar…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <Globe2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold mb-1">Asnjë tour ende</h3>
            <p className="text-sm text-muted-foreground">Administratori mund të shtojë tour-e nga paneli.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to="/explorer-360/tour/$slug"
                params={{ slug: t.slug }}
                className="group rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {t.cover_url ? (
                    <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Globe2 className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold">{t.title}</h3>
                    {t.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                        {t.category}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                  {t.lat != null && t.lng != null && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {t.lat.toFixed(3)}, {t.lng.toFixed(3)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ExploreFab />
      <AiGuide />
    </div>
  );
}