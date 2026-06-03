import { useEffect, useRef } from "react";
import Marzipano from "marzipano";

export interface SceneData {
  id: string;
  panoramaUrl: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  hotspots: Array<{
    id: string;
    yaw: number;
    pitch: number;
    title?: string | null;
    body?: string | null;
    type: string;
    media_url?: string | null;
    link_url?: string | null;
    target_scene_id?: string | null;
  }>;
}

interface Props {
  scene: SceneData;
  onHotspot?: (hotspotId: string) => void;
  onViewChange?: (view: { yaw: number; pitch: number; fov: number }) => void;
}

export function PanoramaViewer({ scene, onHotspot, onViewChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Marzipano.Viewer(containerRef.current, {
      controls: { mouseViewMode: "drag" },
    });
    viewerRef.current = viewer;

    const source = Marzipano.ImageUrlSource.fromString(scene.panoramaUrl);
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
    const limiter = Marzipano.RectilinearView.limit.traditional(4000, (100 * Math.PI) / 180);
    const view = new Marzipano.RectilinearView(
      {
        yaw: scene.initialYaw,
        pitch: scene.initialPitch,
        fov: (scene.initialFov * Math.PI) / 180,
      },
      limiter,
    );
    const sceneObj = viewer.createScene({ source, geometry, view, pinFirstLevel: true });

    // Hotspots
    scene.hotspots.forEach((h) => {
      const el = document.createElement("button");
      el.className =
        "h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/90 text-primary-foreground shadow-xl ring-4 ring-primary/30 hover:scale-110 transition-transform flex items-center justify-center text-lg font-bold";
      el.textContent = h.type === "info" ? "i" : h.type === "scene" ? "→" : "★";
      el.title = h.title ?? "";
      el.onclick = (e) => {
        e.stopPropagation();
        onHotspot?.(h.id);
      };
      sceneObj.hotspotContainer().createHotspot(el, { yaw: h.yaw, pitch: h.pitch });
    });

    sceneObj.switchTo();

    // Notify view changes (yaw/pitch/fov) for overlays like compass
    let rafId: number | null = null;
    const emit = () => {
      if (!onViewChange) return;
      const params = view.parameters();
      onViewChange({ yaw: params.yaw, pitch: params.pitch, fov: params.fov });
    };
    const onChange = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        emit();
      });
    };
    view.addEventListener("change", onChange);
    emit();

    return () => {
      view.removeEventListener("change", onChange);
      if (rafId != null) cancelAnimationFrame(rafId);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [scene, onHotspot, onViewChange]);

  return <div ref={containerRef} className="absolute inset-0 bg-black" />;
}