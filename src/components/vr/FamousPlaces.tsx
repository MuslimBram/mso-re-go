import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin } from "lucide-react";

export interface FamousPlace {
  name: string;
  lat: number;
  lng: number;
  category: "islamic" | "world";
}

export const FAMOUS_PLACES: FamousPlace[] = [
  // Vende të shenjta islame
  { name: "🕋 Qabeja — Mekë", lat: 21.4225, lng: 39.8262, category: "islamic" },
  { name: "🕌 El-Mesxhid en-Nebeui — Medinë", lat: 24.4672, lng: 39.6111, category: "islamic" },
  { name: "🕌 Xhamia Al-Aksa — Kudus", lat: 31.7780, lng: 35.2354, category: "islamic" },
  { name: "🏔️ Mali Arafat", lat: 21.3548, lng: 39.9843, category: "islamic" },
  { name: "🏞️ Mina", lat: 21.4133, lng: 39.8933, category: "islamic" },
  { name: "🌄 Xhebel al-Nur (Hira)", lat: 21.4577, lng: 39.8597, category: "islamic" },
  { name: "🕌 Imam Ali — Najaf", lat: 32.0006, lng: 44.3147, category: "islamic" },
  { name: "🕌 Imam Husein — Karbala", lat: 32.6164, lng: 44.0322, category: "islamic" },
  { name: "📚 Timbuktu", lat: 16.7666, lng: -3.0026, category: "islamic" },
  // Monumente botërore
  { name: "🗼 Kulla Eiffel — Paris", lat: 48.8584, lng: 2.2945, category: "world" },
  { name: "🗽 Statuja e Lirisë — New York", lat: 40.6892, lng: -74.0445, category: "world" },
  { name: "🏟️ Koloseu — Romë", lat: 41.8902, lng: 12.4922, category: "world" },
  { name: "🏯 Muri i Madh — Kinë", lat: 40.4319, lng: 116.5704, category: "world" },
  { name: "🕌 Shën Sofia — Stamboll", lat: 41.0086, lng: 28.9802, category: "world" },
  { name: "🏝️ Burj Khalifa — Dubai", lat: 25.1972, lng: 55.2744, category: "world" },
];

interface Props {
  onTeleport: (lat: number, lng: number, name: string) => void;
  onClose: () => void;
}

export function FamousPlaces({ onTeleport, onClose }: Props) {
  const islamic = FAMOUS_PLACES.filter((p) => p.category === "islamic");
  const world = FAMOUS_PLACES.filter((p) => p.category === "world");

  return (
    <div className="fixed top-20 right-4 bottom-4 w-80 z-20 glass-panel rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Vende të famshme</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Vende të shenjta islame
            </h4>
            <div className="space-y-1">
              {islamic.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onTeleport(p.lat, p.lng, p.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Monumente botërore
            </h4>
            <div className="space-y-1">
              {world.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onTeleport(p.lat, p.lng, p.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}