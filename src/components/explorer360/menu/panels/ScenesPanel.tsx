import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Scene { id: string; name: string; panorama_url: string | null }

export function ScenesPanel({ tourId, currentSceneId, onJump }: { tourId: string; currentSceneId?: string; onJump: (id: string) => void }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  useEffect(() => {
    supabase.from("tour_scenes").select("id,name,panorama_url").eq("tour_id", tourId).order("order_index")
      .then(({ data }) => setScenes((data ?? []) as Scene[]));
  }, [tourId]);
  return (
    <ul className="space-y-1.5">
      {scenes.map((s) => (
        <li key={s.id}>
          <button onClick={() => onJump(s.id)} className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm ${s.id === currentSceneId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
            {s.panorama_url && <img src={s.panorama_url} alt="" className="h-10 w-16 object-cover rounded" />}
            <span className="truncate flex-1">{s.name}</span>
          </button>
        </li>
      ))}
      {scenes.length === 0 && <p className="text-xs text-muted-foreground">Asnjë skenë.</p>}
    </ul>
  );
}