import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NavScene } from "../../viewer/SceneNavArrows";

const currentIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:hsl(var(--primary));border:2px solid white;box-shadow:0 0 0 2px hsl(var(--primary)/.4)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

export function MapPanel({ scenes, currentSceneId, onJump }: { scenes: NavScene[]; currentSceneId?: string; onJump: (id: string) => void }) {
  const current = scenes.find((s) => s.id === currentSceneId) ?? scenes[0];
  if (!current) return <p className="text-sm text-muted-foreground">Pa koordinata.</p>;
  return (
    <div className="h-[400px] rounded-lg overflow-hidden">
      <MapContainer center={[current.lat, current.lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png" subdomains="abcd" />
        <Marker position={[current.lat, current.lng]} icon={currentIcon} />
        {scenes.filter((s) => s.id !== current.id).map((s) => (
          <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={6}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.7 }}
            eventHandlers={{ click: () => onJump(s.id) }} />
        ))}
      </MapContainer>
    </div>
  );
}