import { useEffect, useState } from "react";
import {
  Map as MapIcon, Globe2, Glasses, Heart, Landmark, Store,
  Route as RouteIcon, Search as SearchIcon, Sparkles, X, ChevronUp,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScenesPanel } from "./panels/ScenesPanel";
import { FavoritesPanel } from "./panels/FavoritesPanel";
import { PoisPanel } from "./panels/PoisPanel";
import { RoutesPanel } from "./panels/RoutesPanel";
import { SearchPanel } from "./panels/SearchPanel";
import { MapPanel } from "./panels/MapPanel";
import { VrPanel } from "./panels/VrPanel";
import { AiPanel } from "./panels/AiPanel";
import type { NavScene } from "../viewer/SceneNavArrows";

export type MenuTab =
  | "map" | "scenes" | "vr" | "favorites" | "attractions"
  | "businesses" | "routes" | "search" | "ai";

const TABS: Array<{ id: MenuTab; icon: typeof MapIcon; label: string }> = [
  { id: "map", icon: MapIcon, label: "Map" },
  { id: "scenes", icon: Globe2, label: "360°" },
  { id: "vr", icon: Glasses, label: "VR" },
  { id: "favorites", icon: Heart, label: "Favorites" },
  { id: "attractions", icon: Landmark, label: "Attractions" },
  { id: "businesses", icon: Store, label: "Businesses" },
  { id: "routes", icon: RouteIcon, label: "Routes" },
  { id: "search", icon: SearchIcon, label: "Search" },
  { id: "ai", icon: Sparkles, label: "AI Guide" },
];

interface Props {
  tourId: string;
  tourTitle: string;
  currentSceneId?: string;
  currentSceneName?: string;
  scenes: NavScene[];
  onJumpScene: (sceneId: string) => void;
  onEnterVr?: () => void;
}

export function ExplorerMenu(props: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<MenuTab | null>(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTab(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const renderPanel = (t: MenuTab) => {
    switch (t) {
      case "map":         return <MapPanel scenes={props.scenes} currentSceneId={props.currentSceneId} onJump={(id) => { props.onJumpScene(id); setTab(null); }} />;
      case "scenes":      return <ScenesPanel tourId={props.tourId} currentSceneId={props.currentSceneId} onJump={(id) => { props.onJumpScene(id); setTab(null); }} />;
      case "vr":          return <VrPanel onEnter={() => { props.onEnterVr?.(); setTab(null); }} />;
      case "favorites":   return <FavoritesPanel />;
      case "attractions": return <PoisPanel tourId={props.tourId} category="attractions" />;
      case "businesses":  return <PoisPanel tourId={props.tourId} category="businesses" />;
      case "routes":      return <RoutesPanel tourId={props.tourId} onJumpScene={(id) => { props.onJumpScene(id); setTab(null); }} />;
      case "search":      return <SearchPanel tourId={props.tourId} onJumpScene={(id) => { props.onJumpScene(id); setTab(null); }} />;
      case "ai":          return <AiPanel context={`Tour: ${props.tourTitle}${props.currentSceneName ? ` · Skena: ${props.currentSceneName}` : ""}`} />;
    }
  };

  const activeMeta = tab ? TABS.find((t) => t.id === tab) : null;

  /* ============ MOBILE: bottom sheet ============ */
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setTab("scenes")}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-xl text-slate-900 shadow-2xl border border-white/40 font-semibold text-sm"
        >
          <ChevronUp className="h-4 w-4" /> Menu
        </button>
        <Drawer open={tab !== null} onOpenChange={(o) => !o && setTab(null)}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="flex items-center gap-2">
                {activeMeta && <activeMeta.icon className="h-4 w-4" />} {activeMeta?.label}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto border-b">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <t.icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">{tab && renderPanel(tab)}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  /* ============ DESKTOP: floating glass card ============ */
  return (
    <>
      <div className="fixed top-1/2 left-4 -translate-y-1/2 z-30 flex flex-col gap-1.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(tab === t.id ? null : t.id)}
            className={`group relative h-10 w-10 rounded-xl flex items-center justify-center transition-all ${tab === t.id ? "bg-primary text-primary-foreground scale-110" : "text-white/80 hover:bg-white/10"}`}
            title={t.label}
          >
            <t.icon className="h-4.5 w-4.5" />
            <span className="pointer-events-none absolute left-full ml-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {t.label}
            </span>
          </button>
        ))}
      </div>
      {tab && activeMeta && (
        <div className="fixed top-1/2 left-20 -translate-y-1/2 z-30 w-80 max-h-[78vh] flex flex-col rounded-2xl bg-background text-foreground shadow-2xl border overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2 font-bold text-sm">
              <activeMeta.icon className="h-4 w-4 text-primary" /> {activeMeta.label}
            </div>
            <button onClick={() => setTab(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-3">{renderPanel(tab)}</div>
        </div>
      )}
    </>
  );
}