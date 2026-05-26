import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { ApiKeyGate } from "@/components/vr/ApiKeyGate";
import { MiniMap } from "@/components/vr/MiniMap";
import { StreetViewExplorer, type PanoState } from "@/components/vr/StreetViewExplorer";
import { ControlsHelp } from "@/components/vr/ControlsHelp";
import { FavoritesPanel } from "@/components/vr/FavoritesPanel";
import { VRStereoView } from "@/components/vr/VRStereoView";
import { FamousPlaces } from "@/components/vr/FamousPlaces";
import { QuranPlayer } from "@/components/vr/QuranPlayer";
import { SuggestPlaceDialog } from "@/components/vr/SuggestPlaceDialog";
import { SearchBar } from "@/components/vr/SearchBar";
import { DirectionsPanel } from "@/components/vr/DirectionsPanel";
import { AccessibilityPanel } from "@/components/vr/AccessibilityPanel";
import { Button } from "@/components/ui/button";
import { Headphones, Star, Library, LogIn, LogOut, Globe2, Settings, Sparkles, Compass, BookOpen, Glasses, Volume2, MessageSquarePlus, X, Route as RouteIcon } from "lucide-react";
import { getGoogleMapsKey, clearGoogleMapsKey } from "@/lib/google-maps-key";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast, Toaster } from "sonner";
import logoImage from "@/assets/muslim-site-online-logo-transparent.png";

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
      { property: "og:title", content: "VR Explorer — Eksploro botën në Street View 360°" },
      {
        property: "og:description",
        content:
          "Udhëto në Mekë, Medinë, Al-Aksa e qindra vende të tjera me Google Street View 360° dhe modalitet VR Headset.",
      },
      { property: "og:url", content: "https://rrogozhina-guide.com/" },
    ],
    links: [{ rel: "canonical", href: "https://rrogozhina-guide.com/" }],
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
  const [vrOpen, setVrOpen] = useState(false);
  const [showFamous, setShowFamous] = useState(false);
  const [showQuran, setShowQuran] = useState(false);
  const [quranVolume, setQuranVolume] = useState(0.8);
  const [showExplorerNew, setShowExplorerNew] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const handleVoiceCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    if (c.includes("ndalo") || c.includes("stop")) {
      window.speechSynthesis?.cancel();
      return;
    }
    if (c.includes("kuran")) {
      setShowQuran((s) => (c.includes("mbyll") ? false : c.includes("hap") ? true : !s));
      return;
    }
    if (c.includes("drejtim")) {
      setShowDirections((s) => (c.includes("mbyll") ? false : c.includes("hap") ? true : !s));
      return;
    }
    if (c.includes("sugjero") || c.includes("vend i ri")) {
      setShowSuggest(true);
      return;
    }
    if (c.includes("vr") || c.includes("syze")) {
      if (panoramaInstanceRef.current) setVrOpen(true);
      return;
    }
    if (c.includes("famsh") || c.includes("famous")) {
      setShowFamous(true);
      return;
    }
    if (c.includes("explorer")) {
      setShowExplorerNew(true);
    }
  }, []);

  const pendingPlaceNameRef = useRef<string | null>(null);
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

  // Check admin role
  useEffect(() => {
    if (!user) { setIsOwner(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsOwner(!!data));
  }, [user]);

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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setTarget({ lat, lng, ts: Date.now() });
  }, []);

  const handleTeleport = useCallback((lat: number, lng: number) => {
    setTarget({ lat, lng, ts: Date.now() });
    setShowFavorites(false);
  }, []);

  const handleTeleportResult = useCallback(({ ok }: { ok: boolean; name?: string }) => {
    const label = pendingPlaceNameRef.current;
    if (!label) return;
    if (ok) {
      toast.success(`Duke udhëtuar drejt ${label}`);
    } else {
      toast.error(`Ky vend nuk ka pamje të arritshme: ${label}`);
    }
    pendingPlaceNameRef.current = null;
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
      <h1 className="sr-only">VR Explorer — Eksploro botën në Street View 360°</h1>

      {/* Top-center: Explorer New + Kuran */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 pointer-events-auto">
        <Button
          size="lg"
          className="hud-glow gap-3 h-16 px-8 text-lg font-semibold rounded-2xl"
          onClick={() => setShowExplorerNew(true)}
        >
          <Compass className="h-7 w-7" />
          Explorer <span className="font-bold">New</span>
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="glass-panel gap-2 h-12 px-5 text-base font-semibold rounded-xl"
          onClick={() => setShowQuran((s) => !s)}
        >
          <BookOpen className="h-5 w-5" />
          <Headphones className="h-5 w-5" />
          Kur'ani
        </Button>
        <div className="glass-panel h-12 px-3 rounded-xl flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={quranVolume}
            onChange={(e) => setQuranVolume(Number(e.target.value))}
            className="w-24 accent-primary"
            aria-label="Volumi i Kur'anit"
            title="Volumi i Kur'anit"
          />
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="glass-panel gap-2 h-12 px-4 text-sm font-semibold rounded-xl"
          onClick={() => setShowSuggest(true)}
          title="Sugjero një vend"
        >
          <MessageSquarePlus className="h-5 w-5" />
          Sugjero vend
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="glass-panel gap-2 h-12 px-4 text-sm font-semibold rounded-xl"
          onClick={() => setShowDirections((s) => !s)}
          title="Drejtime & pika qendrimi"
        >
          <RouteIcon className="h-5 w-5" />
          Drejtime
        </Button>
      </div>

      {/* Search bar */}
      {mapsReady && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 w-[min(520px,92vw)] pointer-events-auto">
          <SearchBar
            ready={mapsReady}
            onSelect={({ lat, lng, name }) => {
              pendingPlaceNameRef.current = name;
              setTarget({ lat, lng, ts: Date.now() });
            }}
          />
        </div>
      )}

      {mapsReady && (
        <StreetViewExplorer
          initial={DEFAULT_LOCATION}
          target={target}
          onChange={setPano}
          onPanoramaReady={(p) => (panoramaInstanceRef.current = p)}
          onTeleportResult={handleTeleportResult}
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
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            onClick={() => setShowFamous((s) => !s)}
            variant="ghost"
            size="icon"
            className="h-11 w-11 glass-panel"
            title="Vende të famshme"
            aria-label="Vende të famshme"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          {isOwner && (
            <>
              <Button
                onClick={saveCurrentAsFavorite}
                variant="ghost"
                size="icon"
                className="h-11 w-11 glass-panel"
                title="Ruaj si favorite"
                aria-label="Ruaj si favorite"
              >
                <Star className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => setShowFavorites((s) => !s)}
                variant="ghost"
                size="icon"
                className="h-11 w-11 glass-panel"
                title="Bibliotekë"
                aria-label="Hap bibliotekën"
              >
                <Library className="h-5 w-5" />
              </Button>
            </>
          )}
          {user ? (
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Çkyçu" aria-label="Çkyçu">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Kyçu" aria-label="Kyçu">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {isOwner && (
            <Button onClick={handleClearKey} variant="ghost" size="icon" className="h-11 w-11 glass-panel" title="Cilësimet" aria-label="Cilësimet">
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <AccessibilityPanel onCommand={handleVoiceCommand} />
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
              setVrOpen(true);
            }}
            size="lg"
            className="hud-glow pulse-ring"
          >
            <Glasses className="h-5 w-5 mr-2" /> VR Headset
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

      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 pointer-events-none">
        <img src={logoImage} alt="Muslim Site On-line" className="h-8 w-auto opacity-80" loading="lazy" />
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

      {/* Famous places panel */}
      {showFamous && (
        <FamousPlaces
          apiKey={apiKey}
          onTeleport={(lat, lng, name) => {
            pendingPlaceNameRef.current = name;
            handleTeleport(lat, lng);
            setShowFamous(false);
          }}
          onClose={() => setShowFamous(false)}
        />
      )}

      <QuranPlayer
        open={showQuran}
        onClose={() => setShowQuran(false)}
        externalVolume={quranVolume}
        onVolumeChange={setQuranVolume}
        isOwner={isOwner}
      />

      <SuggestPlaceDialog
        open={showSuggest}
        onClose={() => setShowSuggest(false)}
        currentLat={pano.lat}
        currentLng={pano.lng}
      />

      {mapsReady && (
        <DirectionsPanel
          open={showDirections}
          onClose={() => setShowDirections(false)}
          currentLat={pano.lat}
          currentLng={pano.lng}
          onTeleport={(lat, lng, name) => {
            if (name) pendingPlaceNameRef.current = name;
            setTarget({ lat, lng, ts: Date.now() });
          }}
        />
      )}

      {/* Explorer New modal */}
      {showExplorerNew && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <Button
            onClick={() => setShowExplorerNew(false)}
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 z-10 h-11 w-11 rounded-full shadow-lg"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </Button>
          <iframe
            src="/explorer-new.html"
            title="Explorer New"
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Sphere / VR overlay */}
      {vrOpen && panoramaInstanceRef.current && apiKey && (
        <VRStereoView
          panorama={panoramaInstanceRef.current}
          onExit={() => setVrOpen(false)}
        />
      )}

      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
