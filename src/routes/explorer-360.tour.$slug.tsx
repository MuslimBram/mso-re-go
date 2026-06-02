import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Glasses, MapPin, Volume2, X, Globe2 } from "lucide-react";
import { PanoramaViewer, type SceneData } from "@/components/explorer360/PanoramaViewer";
import { ExploreFab } from "@/components/explorer360/ExploreFab";
import { AiGuide } from "@/components/explorer360/AiGuide";

export const Route = createFileRoute("/explorer-360/tour/$slug")({
  component: TourPage,
});

interface Tour {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
}
interface SceneRow {
  id: string;
  name: string;
  panorama_url: string | null;
  source: string;
  street_view_pano_id: string | null;
  street_view_lat: number | null;
  street_view_lng: number | null;
  initial_yaw: number;
  initial_pitch: number;
  initial_fov: number;
  order_index: number;
}
interface Hotspot {
  id: string;
  scene_id: string;
  type: string;
  yaw: number;
  pitch: number;
  title: string | null;
  body: string | null;
  media_url: string | null;
  link_url: string | null;
  target_scene_id: string | null;
}

function TourPage() {
  const { slug } = useParams({ from: "/explorer-360/tour/$slug" });
  const [tour, setTour] = useState<Tour | null>(null);
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [vrMode, setVrMode] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: tourRow } = await supabase
        .from("tours")
        .select("id,slug,title,description,category,lat,lng")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!tourRow) {
        setNotFound(true);
        return;
      }
      setTour(tourRow as Tour);
      const { data: sceneRows } = await supabase
        .from("tour_scenes")
        .select("*")
        .eq("tour_id", tourRow.id)
        .order("order_index", { ascending: true });
      const sceneList = (sceneRows ?? []) as SceneRow[];
      setScenes(sceneList);
      if (sceneList.length > 0) {
        const { data: hsRows } = await supabase
          .from("tour_hotspots")
          .select("*")
          .in("scene_id", sceneList.map((s) => s.id));
        setHotspots((hsRows ?? []) as Hotspot[]);
      }
    })();
  }, [slug]);

  const currentScene = scenes[currentIdx];

  const sceneData: SceneData | null = useMemo(() => {
    if (!currentScene) return null;
    const url =
      currentScene.source === "upload" && currentScene.panorama_url
        ? currentScene.panorama_url
        : currentScene.panorama_url ?? "";
    if (!url) return null;
    return {
      id: currentScene.id,
      panoramaUrl: url,
      initialYaw: currentScene.initial_yaw,
      initialPitch: currentScene.initial_pitch,
      initialFov: currentScene.initial_fov,
      hotspots: hotspots
        .filter((h) => h.scene_id === currentScene.id)
        .map((h) => ({
          id: h.id,
          yaw: h.yaw,
          pitch: h.pitch,
          title: h.title,
          body: h.body,
          type: h.type,
          media_url: h.media_url,
          link_url: h.link_url,
          target_scene_id: h.target_scene_id,
        })),
    };
  }, [currentScene, hotspots]);

  const handleHotspot = (id: string) => {
    const h = hotspots.find((x) => x.id === id);
    if (!h) return;
    if (h.type === "scene" && h.target_scene_id) {
      const idx = scenes.findIndex((s) => s.id === h.target_scene_id);
      if (idx >= 0) setCurrentIdx(idx);
      return;
    }
    setActiveHotspot(h);
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Globe2 className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Tour-i nuk u gjet</h1>
        <Link to="/explorer-360"><Button>Kthehu tek lista</Button></Link>
      </div>
    );
  }

  if (!tour) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Duke ngarkuar…</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
        <Link to="/explorer-360" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur text-sm">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Tour-et</span>
        </Link>
        <div className="flex-1 text-center">
          <div className="font-bold text-sm sm:text-base">{tour.title}</div>
          {currentScene && <div className="text-xs opacity-70">{currentScene.name}</div>}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setVrMode((v) => !v)}
          className="gap-1.5"
          disabled={!sceneData}
        >
          <Glasses className="h-4 w-4" /> VR
        </Button>
      </div>

      {/* Viewer */}
      <div className="relative h-screen w-screen">
        {sceneData ? (
          <PanoramaViewer scene={sceneData} onHotspot={handleHotspot} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <Globe2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="opacity-70">Ky tour nuk ka ende skena të publikuara.</p>
            </div>
          </div>
        )}

        {vrMode && sceneData && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-4 right-4 pointer-events-auto">
              <Button size="sm" variant="secondary" onClick={() => setVrMode(false)}>
                <X className="h-4 w-4 mr-1" /> Dil nga VR
              </Button>
            </div>
            <div className="absolute inset-0 grid grid-cols-2 border-x-2 border-black/50 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Scene nav */}
      {scenes.length > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
          <Button size="icon" variant="ghost" disabled={currentIdx === 0} onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} className="h-8 w-8 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{currentIdx + 1} / {scenes.length}</span>
          <Button size="icon" variant="ghost" disabled={currentIdx === scenes.length - 1} onClick={() => setCurrentIdx((i) => Math.min(scenes.length - 1, i + 1))} className="h-8 w-8 text-white hover:bg-white/20">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Minimap (GPS) */}
      {tour.lat != null && tour.lng != null && (
        <a
          href={`https://www.google.com/maps?q=${tour.lat},${tour.lng}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 left-6 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs hover:bg-white/20"
        >
          <MapPin className="h-3.5 w-3.5" /> Hap në Maps
        </a>
      )}

      {/* Hotspot dialog */}
      {activeHotspot && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur" onClick={() => setActiveHotspot(null)}>
          <div className="w-full max-w-md rounded-2xl bg-background text-foreground p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-lg">{activeHotspot.title ?? "Info"}</h3>
              <button onClick={() => setActiveHotspot(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {activeHotspot.body && <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">{activeHotspot.body}</p>}
            {activeHotspot.type === "image" && activeHotspot.media_url && (
              <img src={activeHotspot.media_url} alt="" className="rounded-lg w-full" />
            )}
            {activeHotspot.type === "audio" && activeHotspot.media_url && (
              <audio controls src={activeHotspot.media_url} className="w-full" />
            )}
            {activeHotspot.type === "video" && activeHotspot.media_url && (
              <video controls src={activeHotspot.media_url} className="w-full rounded-lg" />
            )}
            {activeHotspot.link_url && (
              <a href={activeHotspot.link_url} target="_blank" rel="noreferrer" className="block mt-3">
                <Button className="w-full">Hap lidhjen</Button>
              </a>
            )}
          </div>
        </div>
      )}

      <ExploreFab />
      <AiGuide context={`Tour: ${tour.title}. ${tour.description ?? ""}${currentScene ? `. Skena aktuale: ${currentScene.name}` : ""}`} />

      {/* Silence unused-icon warning */}
      <span className="hidden"><Volume2 /></span>
    </div>
  );
}