import { useEffect, useState } from "react";
import { Star, Trash2, MapPin, History as HistoryIcon, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";

export interface FavoriteRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading: number | null;
  pitch: number | null;
}

export interface HistoryRow {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  visited_at: string;
}

interface Props {
  user: User | null;
  refreshKey: number;
  onTeleport: (lat: number, lng: number) => void;
  onClose: () => void;
}

export function FavoritesPanel({ user, refreshKey, onTeleport, onClose }: Props) {
  const [tab, setTab] = useState<"favorites" | "history">("favorites");
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from("favorites").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("history").select("*").order("visited_at", { ascending: false }).limit(50),
    ]).then(([f, h]) => {
      if (f.data) setFavorites(f.data as FavoriteRow[]);
      if (h.data) setHistory(h.data as HistoryRow[]);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user, refreshKey]);

  const removeFavorite = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (!error) {
      setFavorites((f) => f.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 glass-panel border-l z-20 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-foreground/10">
        <h2 className="font-semibold">Bibliotekë</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <Star className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Kyçu për të ruajtur vendet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ruaj favorites & ndiq historikun nga çdo pajisje.
            </p>
          </div>
          <Link to="/auth">
            <Button><LogIn className="h-4 w-4 mr-2" />Kyçu</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex border-b border-foreground/10">
            <button
              onClick={() => setTab("favorites")}
              className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 transition-colors ${
                tab === "favorites" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <Star className="h-4 w-4" /> Favorites
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 transition-colors ${
                tab === "history" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <HistoryIcon className="h-4 w-4" /> Histori
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading && <p className="text-center text-sm text-muted-foreground py-8">Duke ngarkuar...</p>}
            {!loading && tab === "favorites" && favorites.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Asnjë vend i ruajtur ende.</p>
            )}
            {!loading && tab === "history" && history.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Histori bosh.</p>
            )}

            {tab === "favorites" &&
              favorites.map((f) => (
                <div key={f.id} className="group flex items-center gap-2 p-3 rounded-lg hover:bg-foreground/5 transition-colors">
                  <button onClick={() => onTeleport(f.lat, f.lng)} className="flex-1 text-left flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.lat.toFixed(3)}, {f.lng.toFixed(3)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeFavorite(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

            {tab === "history" &&
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onTeleport(h.lat, h.lng)}
                  className="w-full text-left flex items-start gap-2 p-3 rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{h.name || "Vend pa emër"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.visited_at).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}