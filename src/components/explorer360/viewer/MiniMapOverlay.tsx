import { useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, X } from "lucide-react";

export interface MiniMapScene {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  current: { lat: number; lng: number; name?: string };
  neighbors?: MiniMapScene[];
  onSelectScene?: (sceneId: string) => void;
}

const currentIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:hsl(var(--primary));border:2px solid white;box-shadow:0 0 0 2px hsl(var(--primary)/.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function MiniMapOverlay({ current, neighbors = [], onSelectScene }: Props) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-30 h-11 w-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80"
        aria-label="Hap mini-hartën"
      >
        <MapIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-30 w-56 h-44 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl">
      <div className="absolute inset-0">
        <MapContainer
          center={[current.lat, current.lng]}
          zoom={16}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <Marker position={[current.lat, current.lng]} icon={currentIcon} />
          {neighbors
            .filter((n) => n.lat != null && n.lng != null)
            .map((n) => (
              <CircleMarker
                key={n.id}
                center={[n.lat, n.lng]}
                radius={5}
                pathOptions={{ color: "white", fillColor: "white", fillOpacity: 0.9, weight: 1 }}
                eventHandlers={{ click: () => onSelectScene?.(n.id) }}
              />
            ))}
        </MapContainer>
      </div>
      <button
        onClick={() => setOpen(false)}
        className="absolute top-1 right-1 z-[400] h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
        aria-label="Mbyll mini-hartën"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}