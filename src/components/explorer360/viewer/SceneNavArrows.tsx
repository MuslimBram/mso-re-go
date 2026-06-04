import { useMemo } from "react";
import { ChevronUp } from "lucide-react";
import { bearingDeg, bearingToYawRad, haversineMeters } from "@/lib/geo";

export interface NavScene {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading?: number;
}

interface Props {
  current: { lat: number; lng: number; headingDeg: number };
  /** Camera yaw in radians (Marzipano convention). */
  cameraYaw: number;
  scenes: NavScene[];
  /** Optional explicit neighbor ids; if missing we take ≤120m candidates. */
  neighborIds?: Set<string>;
  maxDistanceM?: number;
  onJump: (sceneId: string) => void;
}

/**
 * Google Street View-style ground arrows. For each neighbor scene we draw a
 * floating arrow positioned along the horizontal axis based on its bearing
 * relative to the current camera yaw. Arrows fade out as they leave the
 * visible 180° forward cone.
 */
export function SceneNavArrows({
  current,
  cameraYaw,
  scenes,
  neighborIds,
  maxDistanceM = 120,
  onJump,
}: Props) {
  const neighbors = useMemo(() => {
    return scenes
      .map((s) => {
        const dist = haversineMeters(current, s);
        const brg = bearingDeg(current, s);
        // Yaw to scene relative to scene's panorama heading (so arrow stays anchored to world).
        const targetYaw = bearingToYawRad(brg, current.headingDeg);
        return { s, dist, brg, targetYaw };
      })
      .filter(({ s, dist }) => {
        if (neighborIds) return neighborIds.has(s.id);
        return dist > 0.5 && dist <= maxDistanceM;
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);
  }, [scenes, current, neighborIds, maxDistanceM]);

  if (neighbors.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-32 z-20 flex justify-center">
      <div className="relative h-32 w-full max-w-3xl">
        {neighbors.map(({ s, dist, targetYaw }) => {
          // Relative angle from current camera direction (radians).
          let rel = targetYaw - cameraYaw;
          rel = Math.atan2(Math.sin(rel), Math.cos(rel));
          const relDeg = (rel * 180) / Math.PI;
          // Outside ±80° cone → hide
          if (Math.abs(relDeg) > 80) return null;
          // Position along x as percentage (center=0)
          const xPct = 50 + (relDeg / 80) * 45;
          const opacity = 1 - Math.min(1, Math.abs(relDeg) / 80) * 0.65;
          const scale = 1 - Math.min(1, Math.abs(relDeg) / 80) * 0.35;
          // Rotate arrow slightly toward direction
          const tilt = relDeg * 0.4;
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              style={{
                left: `${xPct}%`,
                opacity,
                transform: `translate(-50%, 0) scale(${scale}) rotate(${tilt}deg)`,
                transition: "left 120ms linear, transform 120ms linear, opacity 120ms linear",
              }}
              className="pointer-events-auto absolute bottom-0 flex flex-col items-center gap-1 group"
              title={`${s.name} (${Math.round(dist)}m)`}
            >
              <div className="h-14 w-14 rounded-full bg-white/90 backdrop-blur-md text-slate-900 flex items-center justify-center shadow-2xl border-2 border-white group-hover:scale-110 transition-transform">
                <ChevronUp className="h-7 w-7 stroke-[3]" />
              </div>
              <div className="rounded-full bg-black/70 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap max-w-[120px] truncate">
                {s.name} · {Math.round(dist)}m
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}