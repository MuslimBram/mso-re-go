import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Hit { id: string; name: string; kind: "scene" | "poi" }

export function SearchPanel({ tourId, onJumpScene }: { tourId: string; onJumpScene: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [scenes, setScenes] = useState<Hit[]>([]);
  const [pois, setPois] = useState<Hit[]>([]);
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("tour_scenes").select("id,name").eq("tour_id", tourId);
      const { data: p } = await supabase.from("tour_pois").select("id,name").eq("tour_id", tourId).eq("hidden", false);
      setScenes((s ?? []).map((x) => ({ ...x, kind: "scene" as const })));
      setPois((p ?? []).map((x) => ({ ...x, kind: "poi" as const })));
    })();
  }, [tourId]);
  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return [...scenes, ...pois].filter((h) => h.name.toLowerCase().includes(term)).slice(0, 20);
  }, [q, scenes, pois]);
  return (
    <div className="space-y-3">
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko skena ose vende…" />
      <ul className="space-y-1">
        {hits.map((h) => (
          <li key={`${h.kind}-${h.id}`}>
            <button
              disabled={h.kind === "poi"}
              onClick={() => h.kind === "scene" && onJumpScene(h.id)}
              className="w-full text-left p-2 rounded hover:bg-muted text-sm flex items-center justify-between disabled:opacity-60"
            >
              <span className="truncate">{h.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{h.kind}</span>
            </button>
          </li>
        ))}
        {q && hits.length === 0 && <p className="text-xs text-muted-foreground">Asnjë rezultat.</p>}
      </ul>
    </div>
  );
}