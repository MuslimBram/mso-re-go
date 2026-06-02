import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";

// Fix default icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface TourPin {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  lat: number;
  lng: number;
}

function FitToPins({ pins }: { pins: TourPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [pins, map]);
  return null;
}

export function ToursMap({ pins }: { pins: TourPin[] }) {
  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border shadow-lg">
      <MapContainer center={[41.3275, 19.8187]} zoom={7} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPins pins={pins} />
        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{p.title}</div>
                {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
                <Link to="/explorer-360/tour/$slug" params={{ slug: p.slug }} className="text-primary text-sm underline">
                  Fillo tour-in →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}