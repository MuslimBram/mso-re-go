/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { getGoogleMapsKey } from "@/lib/google-maps-key";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Compass, MapPin, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  lat: number | null;
  lng: number | null;
  heading: number; // 0..360 from true north
  defaultCenter?: { lat: number; lng: number };
  onSave: (v: { lat: number; lng: number; heading: number }) => Promise<void> | void;
}

/**
 * Mini Google Map for setting a panorama's geolocation and heading (degrees
 * clockwise from true north). The heading arrow rotates around the marker so
 * the operator can visually align it with what the panorama center shows.
 */
export function SceneMapEditor({ lat, lng, heading, defaultCenter, onSave }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const markerObj = useRef<google.maps.Marker | null>(null);
  const arrowObj = useRef<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState<{ lat: number; lng: number }>(
    lat != null && lng != null ? { lat, lng } : defaultCenter ?? { lat: 41.0648, lng: 19.6664 },
  );
  const [hdg, setHdg] = useState<number>(((heading % 360) + 360) % 360);
  const [saving, setSaving] = useState(false);

  // arrow icon path (triangle pointing up = north before rotation)
  const arrowIcon = (rotation: number): google.maps.Symbol => ({
    path: "M 0,-22 L 6,-8 L 0,-12 L -6,-8 Z",
    fillColor: "#ef4444",
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 1.2,
    rotation,
  });

  useEffect(() => {
    const key = getGoogleMapsKey();
    if (!key) { toast.error("Google Maps API key mungon"); setLoading(false); return; }
    let cancelled = false;
    loadGoogleMaps(key).then(() => {
      if (cancelled || !mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 18,
        mapTypeId: "hybrid",
        tilt: 0,
        rotateControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: true,
      });
      mapObj.current = map;
      const marker = new google.maps.Marker({ position: pos, map, draggable: true });
      markerObj.current = marker;
      const arrow = new google.maps.Marker({ position: pos, map, icon: arrowIcon(hdg), clickable: false });
      arrowObj.current = arrow;
      marker.addListener("dragend", () => {
        const p = marker.getPosition(); if (!p) return;
        const next = { lat: p.lat(), lng: p.lng() };
        setPos(next);
        arrow.setPosition(next);
      });
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPos(next);
        marker.setPosition(next);
        arrow.setPosition(next);
      });
      setLoading(false);
    }).catch((e) => {
      toast.error(e instanceof Error ? e.message : "Google Maps nuk u ngarkua");
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep arrow rotation in sync with heading slider
  useEffect(() => {
    if (arrowObj.current) arrowObj.current.setIcon(arrowIcon(hdg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hdg]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ lat: pos.lat, lng: pos.lng, heading: ((hdg % 360) + 360) % 360 });
      toast.success("U ruajt vendndodhja dhe veriu");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ruajtja dështoi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border bg-muted" style={{ height: 280 }}>
        <div ref={mapRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-3">
          <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Lat</Label>
          <Input value={pos.lat.toFixed(6)} onChange={(e) => setPos((p) => ({ ...p, lat: Number(e.target.value) || p.lat }))} className="h-8 text-xs" />
        </div>
        <div className="col-span-3">
          <Label className="text-xs">Lng</Label>
          <Input value={pos.lng.toFixed(6)} onChange={(e) => setPos((p) => ({ ...p, lng: Number(e.target.value) || p.lng }))} className="h-8 text-xs" />
        </div>
        <div className="col-span-4">
          <Label className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-1"><Compass className="h-3 w-3" /> Veriu (heading)</span>
            <span className="text-muted-foreground">{Math.round(hdg)}°</span>
          </Label>
          <Slider value={[hdg]} min={0} max={359} step={1} onValueChange={(v) => setHdg(v[0])} />
        </div>
        <div className="col-span-2">
          <Button size="sm" onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1" /> Ruaj</>}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tërhiq markerin ose kliko në hartë për pozicionin. Rrotullo "Veriun" derisa shigjeta të tregojë drejt
        veriut të vërtetë sipas pamjes së panoramës — kjo është orientimi që Google Street View do të përdorë.
      </p>
    </div>
  );
}