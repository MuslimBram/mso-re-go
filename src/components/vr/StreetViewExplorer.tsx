import { useEffect, useRef, useState, useCallback } from "react";

export interface PanoState {
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  panoId?: string;
}

interface Props {
  initial: { lat: number; lng: number };
  target: { lat: number; lng: number; ts: number } | null;
  onChange: (state: PanoState) => void;
  onPanoramaReady: (panorama: google.maps.StreetViewPanorama) => void;
  onTeleportResult?: (result: { ok: boolean; name?: string }) => void;
}

export function StreetViewExplorer({ initial, target, onChange, onPanoramaReady, onTeleportResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const svServiceRef = useRef<google.maps.StreetViewService | null>(null);
  const [noCoverage, setNoCoverage] = useState(false);

  // Init panorama
  useEffect(() => {
    if (!containerRef.current || panoramaRef.current) return;
    const pano = new google.maps.StreetViewPanorama(containerRef.current, {
      position: initial,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      linksControl: true,
      panControl: false,
      zoomControl: false,
      enableCloseButton: false,
      showRoadLabels: false,
    });
    panoramaRef.current = pano;
    svServiceRef.current = new google.maps.StreetViewService();
    onPanoramaReady(pano);

    const emit = () => {
      const pos = pano.getPosition();
      const pov = pano.getPov();
      if (pos) {
        onChange({
          lat: pos.lat(),
          lng: pos.lng(),
          heading: pov.heading || 0,
          pitch: pov.pitch || 0,
          panoId: pano.getPano() || undefined,
        });
      }
    };

    pano.addListener("position_changed", emit);
    pano.addListener("pov_changed", emit);
    pano.addListener("status_changed", () => {
      setNoCoverage(pano.getStatus() !== google.maps.StreetViewStatus.OK);
    });

    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move to target with smooth nearest panorama lookup
  useEffect(() => {
    if (!target || !panoramaRef.current || !svServiceRef.current) return;
    svServiceRef.current.getPanorama(
      { location: { lat: target.lat, lng: target.lng }, radius: 200, source: google.maps.StreetViewSource.OUTDOOR },
      (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
          panoramaRef.current!.setPano(data.location.pano);
          setNoCoverage(false);
          onTeleportResult?.({ ok: true });
        } else {
          setNoCoverage(true);
          onTeleportResult?.({ ok: false });
        }
      }
    );
  }, [target, onTeleportResult]);

  // Keyboard navigation: WASD/Arrows move, Q/E rotate, R/F pitch
  const moveForward = useCallback((reverse = false) => {
    const pano = panoramaRef.current;
    if (!pano) return;
    const links = pano.getLinks();
    if (!links || links.length === 0) return;
    const heading = pano.getPov().heading || 0;
    const target = reverse ? (heading + 180) % 360 : heading;
    let best: google.maps.StreetViewLink | null = null;
    let bestDiff = 360;
    links.forEach((link) => {
      if (!link || link.heading === undefined || link.heading === null) return;
      let diff = Math.abs(link.heading - target);
      if (diff > 180) diff = 360 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = link;
      }
    });
    if (best && bestDiff < 60 && (best as google.maps.StreetViewLink).pano) {
      pano.setPano((best as google.maps.StreetViewLink).pano!);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      keysRef.current.add(e.key.toLowerCase());

      if (["w", "arrowup"].includes(e.key.toLowerCase())) {
        moveForward(false);
      } else if (["s", "arrowdown"].includes(e.key.toLowerCase())) {
        moveForward(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const tick = () => {
      const pano = panoramaRef.current;
      if (pano) {
        const pov = pano.getPov();
        let { heading = 0, pitch = 0 } = pov;
        const zoom = pano.getZoom();
        let zoomChanged = false;
        let changed = false;
        const k = keysRef.current;
        const rotSpeed = 1.8;
        const pitchSpeed = 1.2;
        if (k.has("a") || k.has("arrowleft")) { heading -= rotSpeed; changed = true; }
        if (k.has("d") || k.has("arrowright")) { heading += rotSpeed; changed = true; }
        if (k.has("q")) { heading -= rotSpeed * 1.5; changed = true; }
        if (k.has("e")) { heading += rotSpeed * 1.5; changed = true; }
        if (k.has("r")) { pitch = Math.min(90, pitch + pitchSpeed); changed = true; }
        if (k.has("f")) { pitch = Math.max(-90, pitch - pitchSpeed); changed = true; }
        if (k.has("+") || k.has("=")) { pano.setZoom(Math.min(5, zoom + 0.05)); zoomChanged = true; }
        if (k.has("-")) { pano.setZoom(Math.max(0, zoom - 0.05)); zoomChanged = true; }
        if (changed) pano.setPov({ heading: ((heading % 360) + 360) % 360, pitch });
        void zoomChanged;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [moveForward]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 bg-black" />
      {noCoverage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl glass-panel text-center pointer-events-none">
          <p className="font-medium">Nuk ka mbulim Street View këtu</p>
          <p className="text-sm text-muted-foreground">Provo një vend tjetër ose kliko në mini-map.</p>
        </div>
      )}
    </>
  );
}