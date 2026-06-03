import { useMemo } from "react";

interface Props {
  /** Current camera yaw in radians (Marzipano: 0 = front, increases clockwise). */
  yaw: number;
  /** Optional offset (degrees) so the panorama's "front" aligns with true north. */
  northOffsetDeg?: number;
}

/**
 * Floating compass that rotates with the viewer. North marker stays geographically fixed.
 */
export function CompassOverlay({ yaw, northOffsetDeg = 0 }: Props) {
  const headingDeg = useMemo(() => {
    const deg = (yaw * 180) / Math.PI + northOffsetDeg;
    return ((deg % 360) + 360) % 360;
  }, [yaw, northOffsetDeg]);

  const dirLabel = (() => {
    if (headingDeg < 22.5 || headingDeg >= 337.5) return "N";
    if (headingDeg < 67.5) return "NE";
    if (headingDeg < 112.5) return "E";
    if (headingDeg < 157.5) return "SE";
    if (headingDeg < 202.5) return "S";
    if (headingDeg < 247.5) return "SW";
    if (headingDeg < 292.5) return "W";
    return "NW";
  })();

  return (
    <div
      className="pointer-events-none select-none fixed top-20 right-4 z-30 flex flex-col items-center gap-1"
      aria-label={`Kompas: ${dirLabel} ${Math.round(headingDeg)}°`}
    >
      <div className="relative h-16 w-16 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-xl">
        {/* Rotating dial: rotates opposite to heading so N stays pointing to true north */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ transform: `rotate(${-headingDeg}deg)`, transition: "transform 80ms linear" }}
        >
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-400">N</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70">S</span>
          <span className="absolute top-1/2 -translate-y-1/2 right-1 text-[10px] font-bold text-white/70">E</span>
          <span className="absolute top-1/2 -translate-y-1/2 left-1 text-[10px] font-bold text-white/70">W</span>
          {/* needle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full h-6 w-[2px] bg-red-400 rounded-full" />
        </div>
      </div>
      <div className="rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-white border border-white/10">
        {dirLabel} {Math.round(headingDeg)}°
      </div>
    </div>
  );
}