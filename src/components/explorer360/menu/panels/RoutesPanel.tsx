import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface Route { id: string; name: string; description: string | null; scene_order: unknown; duration_minutes: number | null; difficulty: string | null }

export function RoutesPanel({ tourId, onJumpScene }: { tourId: string; onJumpScene: (id: string) => void }) {
  const [routes, setRoutes] = useState<Route[]>([]);
  useEffect(() => {
    supabase.from("tour_routes").select("*").eq("tour_id", tourId).then(({ data }) => setRoutes((data ?? []) as Route[]));
  }, [tourId]);
  if (routes.length === 0) return <p className="text-xs text-muted-foreground">Asnjë rrugë e definuar.</p>;
  return (
    <ul className="space-y-2">
      {routes.map((r) => {
        const order = Array.isArray(r.scene_order) ? (r.scene_order as string[]) : [];
        return (
          <li key={r.id} className="rounded-lg border p-3 space-y-1.5">
            <div className="font-medium text-sm">{r.name}</div>
            {r.description && <div className="text-[11px] text-muted-foreground">{r.description}</div>}
            <div className="text-[10px] text-muted-foreground">{order.length} skena · {r.duration_minutes ?? "?"}min · {r.difficulty ?? "—"}</div>
            <Button size="sm" className="w-full" disabled={order.length === 0} onClick={() => order[0] && onJumpScene(order[0])}>
              <Play className="h-3 w-3 mr-1" /> Nis rrugën
            </Button>
          </li>
        );
      })}
    </ul>
  );
}