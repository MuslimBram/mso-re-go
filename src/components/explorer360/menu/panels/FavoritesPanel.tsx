import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

interface Fav { id: string; name: string; lat: number; lng: number; thumbnail_url: string | null }

export function FavoritesPanel() {
  const [favs, setFavs] = useState<Fav[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoaded(true); return; }
      const { data } = await supabase.from("favorites").select("id,name,lat,lng,thumbnail_url").order("created_at", { ascending: false });
      setFavs((data ?? []) as Fav[]);
      setLoaded(true);
    })();
  }, []);
  if (!loaded) return <p className="text-xs text-muted-foreground">Duke ngarkuar…</p>;
  if (favs.length === 0) return <p className="text-xs text-muted-foreground">Asnjë favorit. Përdor butonin <Heart className="h-3 w-3 inline" /> në viewer.</p>;
  return (
    <ul className="space-y-1.5">
      {favs.map((f) => (
        <li key={f.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm">
          {f.thumbnail_url && <img src={f.thumbnail_url} alt="" className="h-10 w-16 object-cover rounded" />}
          <div className="flex-1 min-w-0">
            <div className="truncate">{f.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{f.lat.toFixed(4)},{f.lng.toFixed(4)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}