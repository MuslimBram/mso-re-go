import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { ApiKeyGate } from "@/components/vr/ApiKeyGate";
import { SearchBar } from "@/components/vr/SearchBar";
import { MiniMap } from "@/components/vr/MiniMap";
import { StreetViewExplorer, type PanoState } from "@/components/vr/StreetViewExplorer";
import { ControlsHelp } from "@/components/vr/ControlsHelp";
import { FavoritesPanel } from "@/components/vr/FavoritesPanel";
import { VRStereoView, type PanoramaViewMode } from "@/components/vr/VRStereoView";
import { FamousPlaces } from "@/components/vr/FamousPlaces";
import { Button } from "@/components/ui/button";
import { Headphones, Star, Library, LogIn, LogOut, Globe2, Settings, Compass, Sparkles } from "lucide-react";
import { getGoogleMapsKey, clearGoogleMapsKey } from "@/lib/google-maps-key";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "VR Explorer — Eksploro botën në Street View 360°" },
      {
        name: "description",
        content:
          "Aplikacion immersive që përdor Google Street View real për të 'ecur' nëpër botë me kontroll si në lojë, mbështetje për WebXR dhe headsets VR.",
      },
    ],
  }),
});

const DEFAULT_LOCATION = { lat: 41.3275, lng: 19.8187 }; // Tiranë

function Index() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pano, setPano] = useState<PanoState>({ ...DEFAULT_LOCATION, heading: 0, pitch: 0 });
  const [target, setTarget] = useState<{ lat: number; lng: number; ts: number } | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<PanoramaViewMode | null>(null);
  const [showFamous, setShowFamous] = useState(false);
  const panoramaInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const lastHistoryPanoRef = useRef<string | null>(null);

  // Restore key from localStorage
  useEffect(() => {
    setApiKey(getGoogleMapsKey());
  }, []);

  // Load Google Maps when key available
  useEffect(() => {
    if (!apiKey) return;
    setMapsReady(false);
    loadGoogleMaps(apiKey)
      .then(() => setMapsReady(true))
      .catch((e) => {
        toast.error("Gabim në ngarkimin e Google Maps: " + e.message);
        clearGoogleMapsKey();
        setApiKey(null);
      });
  }, [apiKey]);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Save history when pano changes (debounced via panoId)
  useEffect(() => {
    if (!user || !pano.panoId) return;
    if (lastHistoryPanoRef.current === pano.panoId) return;
    lastHistoryPanoRef.current = pano.panoId;
    const t = setTimeout(() => {
      supabase.from("history").insert({
        user_id: user.id,
        lat: pano.lat,
        lng: pano.lng,
        pano_id: pano.panoId,
        name: null,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [pano.panoId, pano.lat, pano.lng, user]);

  const handleSearchSelect = useCallback((loc: { lat: number; lng: number; name: string }) => {
    setTarget({ lat: loc.lat, lng: loc.lng, ts: Date.now() });
    const label = loc.name && loc.name !== "undefined" ? loc.name : "vendin e zgjedhur";
    toast.success(`Duke udhëtuar drejt ${label}`);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setTarget({ lat, lng, ts: Date.now() });
  }, []);

  const handleTeleport = useCallback((lat: number, lng: number) => {
    setTarget({ lat, lng, ts: Date.now() });
    setShowFavorites(false);
  }, []);

  const saveCurrentAsFavorite = async () => {
    if (!user) {
      toast.error("Kyçu për të ruajtur favorites");
      return;
    }
    const name = window.prompt("Emër për këtë vend:", `Vend ${pano.lat.toFixed(3)}, ${pano.lng.toFixed(3)}`);
    if (!name) return;
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      name,
      lat: pano.lat,
      lng: pano.lng,
      heading: pano.heading,
      pitch: pano.pitch,
      pano_id: pano.panoId ?? null,
    });
    if (error) {
      toast.error("Gabim: " + error.message);
    } else {
      toast.success("U ruajt!");
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("U çkyçe");
  };

  const handleClearKey = () => {
    if (window.confirm("Hiq Google Maps API key?")) {
      clearGoogleMapsKey();
      setMapsReady(false);
      setApiKey(null);
      toast.success("API key u hoq");
    }
  };

  if (!apiKey) {
    return (
      <>
        <ApiKeyGate onSubmit={() => setApiKey(getGoogleMapsKey())} />
        <Toaster theme="dark" />
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {mapsReady && (
        <StreetViewExplorer
          initial={DEFAULT_LOCATION}
          target={target}
          onChange={setPano}
          onPanoramaReady={(p) => (panoramaInstanceRef.current = p)}
        />
      )}

      {!mapsReady && (
        <div className="absolute inset-0 flex items-center justify-center text-foreground">
          <div className="flex flex-col items-center gap-3">
            <Globe2 className="h-12 w-12 animate-spin" style={{ animationDuration: "3s" }} />
            <p>Duke ngarkuar Street View...</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="px-3 py-2 rounded-xl glass-panel flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Globe2 className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm hidden sm:inline">VR Explorer</span>
          </div>
          <SearchBar onSelect={handleSearchSelect} ready={mapsReady} />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            onClick={() => setShowFamous((s) => !s)}
            variant="ghost"
            size="icon"
            className="h-11 w-11 glass-panel"
            title="Vende të famshme"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          <Button
            onClick={saveCurrentAsFavorite}
            variant="ghost"
            size="icon"
            className="h-11 w-11 glass-panel"
            title="Ruaj si favorite"
          >
            <Star className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setShowFavorites((s) => !s)}
            variant="ghost"
            size="icon"
            className="h-11 w-11 glass-panel"
            title="Bibliotekë"
          >
            <Library className="h-5 w-5" />
          </Button>
          {user ? (
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Çkyçu">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Kyçu">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <Button onClick={handleClearKey} variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Cilësimet">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom-left: controls help */}
      <div className="absolute bottom-4 left-4 z-10">
        <ControlsHelp />
      </div>

      {/* Bottom-right: Sphere/VR buttons + mini-map */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-3">
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={() => {
              if (!panoramaInstanceRef.current) {
                toast.error("Pamja nuk është gati");
                return;
              }
              setViewMode("sphere-ns");
            }}
            size="lg"
            className="hud-glow"
          >
            <Compass className="h-5 w-5 mr-2" /> Sphere Veri + Jug
          </Button>
          <Button
            onClick={() => {
              if (!panoramaInstanceRef.current) {
                toast.error("Pamja nuk është gati");
                return;
              }
              setViewMode("sphere-ew");
            }}
            size="lg"
            className="hud-glow"
          >
            <Compass className="h-5 w-5 mr-2 rotate-90" /> Sphere Lindje + Perëndim
          </Button>
          <Button
            onClick={() => {
              if (!panoramaInstanceRef.current) {
                toast.error("Pamja nuk është gati");
                return;
              }
              setViewMode("vr");
            }}
            size="lg"
            className="hud-glow pulse-ring"
          >
            <Headphones className="h-5 w-5 mr-2" /> VR Headset
          </Button>
        </div>
        {mapsReady && (
          <MiniMap lat={pano.lat} lng={pano.lng} heading={pano.heading} onClick={handleMapClick} />
        )}
      </div>

      {/* Coordinates HUD */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full glass-panel font-mono text-xs text-muted-foreground">
          {pano.lat.toFixed(5)}, {pano.lng.toFixed(5)} · {Math.round(pano.heading)}°
        </div>
      </div>

      {/* Side panel */}
      {showFavorites && (
        <FavoritesPanel
          user={user}
          refreshKey={refreshKey}
          onTeleport={handleTeleport}
          onClose={() => setShowFavorites(false)}
        />
      )}

      {/* Sphere / VR overlay */}
      {viewMode && panoramaInstanceRef.current && apiKey && (
        <VRStereoView
          panorama={panoramaInstanceRef.current}
          apiKey={apiKey}
          mode={viewMode}
          onExit={() => setViewMode(null)}
        />
      )}

      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
