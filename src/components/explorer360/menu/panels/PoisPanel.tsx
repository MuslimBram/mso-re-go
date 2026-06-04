import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTourPois } from "@/lib/pois.functions";
import { Star, ExternalLink, Phone } from "lucide-react";

interface Poi { id: string; category: string; name: string; description: string | null; rating: number | null; photo_url: string | null; website: string | null; phone: string | null }

const GROUPS: Record<string, string[]> = {
  attractions: ["attraction", "religious"],
  businesses: ["business", "restaurant", "lodging"],
};

export function PoisPanel({ tourId, category }: { tourId: string; category: "attractions" | "businesses" }) {
  const list = useServerFn(listTourPois);
  const [pois, setPois] = useState<Poi[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    list({ data: { tourId } }).then((r) => { setPois(r as Poi[]); setLoaded(true); }).catch(() => setLoaded(true));
  }, [tourId, list]);
  if (!loaded) return <p className="text-xs text-muted-foreground">Duke ngarkuar…</p>;
  const filtered = pois.filter((p) => GROUPS[category].includes(p.category));
  if (filtered.length === 0) return <p className="text-xs text-muted-foreground">Asnjë {category === "attractions" ? "atraksion" : "biznes"}. Admini mund të sinkronizojë nga Google Places.</p>;
  return (
    <ul className="space-y-2">
      {filtered.map((p) => (
        <li key={p.id} className="rounded-lg border p-2 text-sm">
          <div className="flex gap-2">
            {p.photo_url && <img src={p.photo_url} alt="" className="h-14 w-14 object-cover rounded" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              {p.rating != null && <div className="text-[11px] flex items-center gap-0.5 text-amber-500"><Star className="h-3 w-3 fill-current" />{p.rating.toFixed(1)}</div>}
              {p.description && <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>}
              <div className="flex gap-2 mt-1">
                {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="text-[10px] text-primary"><ExternalLink className="h-3 w-3 inline" /> web</a>}
                {p.phone && <a href={`tel:${p.phone}`} className="text-[10px] text-primary"><Phone className="h-3 w-3 inline" /> {p.phone}</a>}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}