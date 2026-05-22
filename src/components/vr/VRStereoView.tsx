import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Headphones, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";

interface Props {
  panorama: google.maps.StreetViewPanorama;
  onExit: () => void;
}

/**
 * VR Headset Mode — renders TWO synchronized Google Street View panoramas
 * side-by-side (one per eye), giving full 360° coverage with NO distortion.
 * Both panoramas share position/POV with the main panorama and stay in sync.
 */
export function VRStereoView({ panorama, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPanoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const rightPanoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const syncingRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Auto-enter fullscreen
  useEffect(() => {
    const enterFs = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        /* user blocked — ignore */
      }
    };
    enterFs();
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // Build the two eye panoramas
  useEffect(() => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;
    const initialPos = panorama.getPosition();
    const initialPov = panorama.getPov();
    const initialPanoId = panorama.getPano();
    if (!initialPos) return;

    const commonOptions: google.maps.StreetViewPanoramaOptions = {
      position: { lat: initialPos.lat(), lng: initialPos.lng() },
      pov: initialPov,
      zoom: panorama.getZoom() || 1,
      addressControl: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      linksControl: false,
      panControl: false,
      zoomControl: false,
      enableCloseButton: false,
      showRoadLabels: false,
      clickToGo: false,
      disableDefaultUI: true,
    };

    const left = new google.maps.StreetViewPanorama(leftEyeRef.current, commonOptions);
    const right = new google.maps.StreetViewPanorama(rightEyeRef.current, commonOptions);
    if (initialPanoId) {
      left.setPano(initialPanoId);
      right.setPano(initialPanoId);
    }
    leftPanoRef.current = left;
    rightPanoRef.current = right;
    setReady(true);

    // ---- Sync logic: any change in main panorama → both eyes
    const syncEyesFromMain = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const id = panorama.getPano();
      const pov = panorama.getPov();
      const zoom = panorama.getZoom();
      if (id) {
        if (left.getPano() !== id) left.setPano(id);
        if (right.getPano() !== id) right.setPano(id);
      }
      left.setPov(pov);
      right.setPov(pov);
      if (typeof zoom === "number") {
        left.setZoom(zoom);
        right.setZoom(zoom);
      }
      syncingRef.current = false;
    };

    // ---- When user drags inside LEFT eye → reflect in main + right
    const syncFromLeft = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const pov = left.getPov();
      const id = left.getPano();
      panorama.setPov(pov);
      right.setPov(pov);
      if (id && id !== panorama.getPano()) {
        panorama.setPano(id);
        right.setPano(id);
      }
      syncingRef.current = false;
    };

    // Same for right eye
    const syncFromRight = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const pov = right.getPov();
      const id = right.getPano();
      panorama.setPov(pov);
      left.setPov(pov);
      if (id && id !== panorama.getPano()) {
        panorama.setPano(id);
        left.setPano(id);
      }
      syncingRef.current = false;
    };

    const l1 = panorama.addListener("pov_changed", syncEyesFromMain);
    const l2 = panorama.addListener("position_changed", syncEyesFromMain);
    const l3 = panorama.addListener("pano_changed", syncEyesFromMain);
    const l4 = left.addListener("pov_changed", syncFromLeft);
    const l5 = left.addListener("pano_changed", syncFromLeft);
    const l6 = right.addListener("pov_changed", syncFromRight);
    const l7 = right.addListener("pano_changed", syncFromRight);

    return () => {
      [l1, l2, l3, l4, l5, l6, l7].forEach((l) => google.maps.event.removeListener(l));
    };
  }, [panorama]);

  // Move forward/backward/left/right by selecting the closest Street View link
  const moveByHeadingOffset = (offsetDeg: number) => {
    const links = panorama.getLinks();
    if (!links || links.length === 0) {
      toast.message("Nuk ka rrugë në këtë drejtim");
      return;
    }
    const baseHeading = panorama.getPov().heading || 0;
    const targetHeading = (((baseHeading + offsetDeg) % 360) + 360) % 360;
    let best: google.maps.StreetViewLink | null = null;
    let bestDiff = 360;
    links.forEach((link) => {
      if (!link || link.heading === undefined || link.heading === null) return;
      let diff = Math.abs(link.heading - targetHeading);
      if (diff > 180) diff = 360 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = link;
      }
    });
    if (best && (best as google.maps.StreetViewLink).pano) {
      panorama.setPano((best as google.maps.StreetViewLink).pano!);
    } else {
      toast.message("Asnjë rrugë në këtë drejtim");
    }
  };

  const rotateYaw = (deltaDeg: number) => {
    const pov = panorama.getPov();
    panorama.setPov({ heading: ((pov.heading || 0) + deltaDeg) % 360, pitch: pov.pitch || 0 });
  };

  const tiltPitch = (deltaDeg: number) => {
    const pov = panorama.getPov();
    const next = Math.max(-89, Math.min(89, (pov.pitch || 0) + deltaDeg));
    panorama.setPov({ heading: pov.heading || 0, pitch: next });
  };

  const zoomBy = (delta: number) => {
    const z = panorama.getZoom() || 1;
    panorama.setZoom(Math.max(0, Math.min(5, z + delta)));
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); moveByHeadingOffset(0); break;
        case "ArrowDown": e.preventDefault(); moveByHeadingOffset(180); break;
        case "ArrowLeft": e.preventDefault(); moveByHeadingOffset(-90); break;
        case "ArrowRight": e.preventDefault(); moveByHeadingOffset(90); break;
        case "a": case "A": rotateYaw(-10); break;
        case "d": case "D": rotateYaw(10); break;
        case "w": case "W": tiltPitch(10); break;
        case "s": case "S": tiltPitch(-10); break;
        case "+": case "=": zoomBy(0.5); break;
        case "-": case "_": zoomBy(-0.5); break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black">
      {/* Two synchronized Street View panoramas, one per eye */}
      <div className="absolute inset-0 flex">
        <div ref={leftEyeRef} className="w-1/2 h-full bg-black" />
        <div ref={rightEyeRef} className="w-1/2 h-full bg-black" />
      </div>

      {/* Vertical divider line between the two eyes */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/60 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="px-4 py-2 rounded-lg glass-panel flex items-center gap-2 pointer-events-auto">
          <Headphones className="h-4 w-4" />
          <span className="text-sm font-medium">VR Headset Mode</span>
        </div>
        <Button onClick={onExit} variant="secondary" size="sm" className="pointer-events-auto">
          <X className="h-4 w-4 mr-1" /> Dil
        </Button>
      </div>

      {/* Help text */}
      {ready && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg glass-panel text-xs text-center max-w-md pointer-events-none z-10">
          <p className="text-muted-foreground">
            Tërhiq me mausin për të rrotulluar. <b>Shigjetat</b> = ec, <b>A/D</b> = rrotullo, <b>W/S</b> = lart/poshtë, <b>+/−</b> = zoom.
          </p>
        </div>
      )}

      {/* Controls duplicated in BOTH eye halves so they appear inside each lens of a VR headset */}
      {[0, 1].map((eye) => (
        <div
          key={eye}
          className="absolute bottom-6 pointer-events-none z-10"
          style={{ left: eye === 0 ? "0%" : "50%", width: "50%" }}
        >
          <div className="flex items-end justify-between px-6 gap-3">
            {/* Movement pad */}
            <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
              <div />
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => moveByHeadingOffset(0)} title="Para" aria-label="Ec para">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div />
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => moveByHeadingOffset(-90)} title="Majtas" aria-label="Ec majtas">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => moveByHeadingOffset(180)} title="Mbrapa" aria-label="Ec mbrapa">
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => moveByHeadingOffset(90)} title="Djathtas" aria-label="Ec djathtas">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Look + zoom */}
            <div className="pointer-events-auto flex flex-col gap-1.5 items-center">
              <div className="flex gap-1.5">
                <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => zoomBy(0.5)} title="Zmadho" aria-label="Zmadho">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => zoomBy(-0.5)} title="Zvogëlo" aria-label="Zvogëlo">
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => tiltPitch(15)} title="Shiko lart" aria-label="Shiko lart">
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => tiltPitch(-15)} title="Shiko poshtë" aria-label="Shiko poshtë">
                  <MoveDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => rotateYaw(-15)} title="Rrotullo majtas" aria-label="Rrotullo majtas">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => rotateYaw(15)} title="Rrotullo djathtas" aria-label="Rrotullo djathtas">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
