import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Route as RouteIcon, Fuel, ParkingCircle, MapPin, Navigation } from "lucide-react";

interface Stop {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  onTeleport: (lat: number, lng: number, name?: string) => void;
}

const newId = () => Math.random().toString(36).slice(2, 9);

function StopInput({
  stop,
  placeholder,
  onChange,
  onRemove,
}: {
  stop: Stop;
  placeholder: string;
  onChange: (s: Stop) => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ref.current || !window.google?.maps?.places) return;
    const ac = new google.maps.places.Autocomplete(ref.current, {
      fields: ["geometry", "name", "formatted_address"],
    });
    const listener = ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (!p.geometry?.location) return;
      onChange({
        ...stop,
        label: p.name || p.formatted_address || "Vend",
        lat: p.geometry.location.lat(),
        lng: p.geometry.location.lng(),
      });
    });
    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-1">
      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        ref={ref}
        defaultValue={stop.label}
        placeholder={placeholder}
        className="h-9 text-xs"
      />
      {onRemove && (
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRemove} aria-label="Hiq">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function DirectionsPanel({ open, onClose, currentLat, currentLng, onTeleport }: Props) {
  const [origin, setOrigin] = useState<Stop>({ id: "o", label: "Vendi im aktual", lat: currentLat, lng: currentLng });
  const [destination, setDestination] = useState<Stop>({ id: "d", label: "" });
  const [waypoints, setWaypoints] = useState<Stop[]>([]);
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
    (window.google?.maps?.TravelMode?.DRIVING ?? "DRIVING") as google.maps.TravelMode
  );
  const [result, setResult] = useState<google.maps.DirectionsResult | null>(null);
  const [summary, setSummary] = useState<{ distance: string; duration: string } | null>(null);
  const [showFuel, setShowFuel] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [poiMarkers, setPoiMarkers] = useState<google.maps.Marker[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // init map
  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: currentLat, lng: currentLng },
      zoom: 10,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    });
    mapInstanceRef.current = map;
    rendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
    });
  }, [open, currentLat, currentLng]);

  const addWaypoint = () => setWaypoints((w) => [...w, { id: newId(), label: "" }]);
  const updateWaypoint = (i: number, s: Stop) =>
    setWaypoints((w) => w.map((x, idx) => (idx === i ? s : x)));
  const removeWaypoint = (i: number) =>
    setWaypoints((w) => w.filter((_, idx) => idx !== i));

  const clearPoiMarkers = () => {
    poiMarkers.forEach((m) => m.setMap(null));
    setPoiMarkers([]);
  };

  const fetchPoisAlongRoute = async (path: google.maps.LatLng[], keyword: string, icon: string) => {
    const map = mapInstanceRef.current;
    if (!map || !path.length) return [];
    const service = new google.maps.places.PlacesService(map);
    // Sample points along the polyline
    const sampleCount = Math.min(6, Math.max(3, Math.floor(path.length / 50)));
    const step = Math.floor(path.length / sampleCount);
    const samples = Array.from({ length: sampleCount }, (_, i) => path[i * step]).filter(Boolean);
    const markers: google.maps.Marker[] = [];
    await Promise.all(
      samples.map(
        (loc) =>
          new Promise<void>((resolve) => {
            service.nearbySearch(
              { location: loc, radius: 3000, keyword },
              (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  results.slice(0, 3).forEach((p) => {
                    if (!p.geometry?.location) return;
                    const m = new google.maps.Marker({
                      map,
                      position: p.geometry.location,
                      title: p.name,
                      label: { text: icon, fontSize: "14px" },
                    });
                    markers.push(m);
                  });
                }
                resolve();
              }
            );
          })
      )
    );
    return markers;
  };

  const compute = async () => {
    if (!destination.lat || !destination.lng) {
      alert("Zgjidh një destinacion nga sugjerimet");
      return;
    }
    if (!origin.lat || !origin.lng) {
      alert("Zgjidh një pikënisje");
      return;
    }
    setLoading(true);
    clearPoiMarkers();
    try {
      const ds = new google.maps.DirectionsService();
      const res = await ds.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints
          .filter((w) => w.lat && w.lng)
          .map((w) => ({ location: { lat: w.lat!, lng: w.lng! }, stopover: true })),
        travelMode,
        provideRouteAlternatives: false,
        optimizeWaypoints: false,
      });
      rendererRef.current?.setDirections(res);
      setResult(res);
      const leg = res.routes[0]?.legs ?? [];
      const totalMeters = leg.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
      const totalSecs = leg.reduce((s, l) => s + (l.duration?.value ?? 0), 0);
      setSummary({
        distance: `${(totalMeters / 1000).toFixed(1)} km`,
        duration: `${Math.floor(totalSecs / 3600)}h ${Math.round((totalSecs % 3600) / 60)}min`,
      });

      // POIs
      const path = res.routes[0]?.overview_path ?? [];
      const newMarkers: google.maps.Marker[] = [];
      if (showFuel) newMarkers.push(...(await fetchPoisAlongRoute(path, "gas station", "⛽")));
      if (showRest) newMarkers.push(...(await fetchPoisAlongRoute(path, "rest area", "🅿️")));
      setPoiMarkers(newMarkers);
    } catch (e: any) {
      alert("Gabim: " + (e?.message || "Nuk u gjet rrugë"));
    } finally {
      setLoading(false);
    }
  };

  const teleportToStop = (s: Stop) => {
    if (s.lat && s.lng) onTeleport(s.lat, s.lng, s.label);
  };

  if (!open) return null;

  return (
    <div className="absolute top-20 right-4 z-30 w-[min(520px,92vw)] max-h-[85vh] glass-panel rounded-2xl p-4 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <RouteIcon className="h-4 w-4" /> Drejtimet & Pikat e qendrimit
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Mbyll">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <StopInput stop={origin} placeholder="Pikënisja" onChange={setOrigin} />
        {waypoints.map((w, i) => (
          <StopInput
            key={w.id}
            stop={w}
            placeholder={`Pikë qendrimi ${i + 1}`}
            onChange={(s) => updateWaypoint(i, s)}
            onRemove={() => removeWaypoint(i)}
          />
        ))}
        <StopInput stop={destination} placeholder="Destinacioni" onChange={setDestination} />
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addWaypoint}>
          <Plus className="h-3 w-3 mr-1" /> Shto pikë qendrimi
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={travelMode}
          onChange={(e) => setTravelMode(e.target.value as google.maps.TravelMode)}
          className="h-8 px-2 rounded-md bg-background border border-border text-xs"
        >
          <option value="DRIVING">🚗 Makinë</option>
          <option value="WALKING">🚶 Këmbë</option>
          <option value="BICYCLING">🚴 Biçikletë</option>
          <option value="TRANSIT">🚌 Transport</option>
        </select>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer">
          <input type="checkbox" checked={showFuel} onChange={(e) => setShowFuel(e.target.checked)} className="accent-primary" />
          <Fuel className="h-3.5 w-3.5" /> Karburante
        </label>
        <label className="flex items-center gap-1 text-[11px] cursor-pointer">
          <input type="checkbox" checked={showRest} onChange={(e) => setShowRest(e.target.checked)} className="accent-primary" />
          <ParkingCircle className="h-3.5 w-3.5" /> Zona pushimi
        </label>
        <Button size="sm" className="ml-auto h-8" onClick={compute} disabled={loading}>
          {loading ? "Po llogarit..." : "Llogarit rrugën"}
        </Button>
      </div>

      {summary && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-primary/10 text-xs flex items-center gap-3">
          <span><strong>{summary.distance}</strong></span>
          <span>•</span>
          <span><strong>{summary.duration}</strong></span>
        </div>
      )}

      <div ref={mapRef} className="w-full h-64 rounded-xl border border-border mb-3 bg-muted" />

      {result && (
        <div className="overflow-y-auto max-h-40 space-y-1">
          <p className="text-[10px] text-muted-foreground mb-1">Kliko mbi një ndalesë për të shkuar atje në Street View:</p>
          {[origin, ...waypoints, destination].map((s, i) => (
            <button
              key={s.id + i}
              onClick={() => teleportToStop(s)}
              disabled={!s.lat}
              className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-[11px] hover:bg-muted disabled:opacity-40"
            >
              <Navigation className="h-3 w-3 shrink-0" />
              <span className="truncate flex-1">{s.label || "(bosh)"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}