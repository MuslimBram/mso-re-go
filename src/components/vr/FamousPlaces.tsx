import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

export interface FamousPlace {
  name: string;
  lat: number;
  lng: number;
  category: "islamic" | "world" | "nature" | "city";
  heading?: number;
}

export const FAMOUS_PLACES: FamousPlace[] = [
  // 🕋 Vende të shenjta islame
  { name: "🕋 Qabeja — Mekë", lat: 21.4225, lng: 39.8262, category: "islamic" },
  { name: "🕌 El-Mesxhid en-Nebeui — Medinë", lat: 24.4672, lng: 39.6111, category: "islamic" },
  { name: "🕌 Xhamia Al-Aksa — Kudus", lat: 31.7780, lng: 35.2354, category: "islamic" },
  { name: "🏔️ Mali Arafat", lat: 21.3548, lng: 39.9843, category: "islamic" },
  { name: "🏞️ Mina", lat: 21.4133, lng: 39.8933, category: "islamic" },
  { name: "🌄 Xhebel al-Nur (Hira)", lat: 21.4577, lng: 39.8597, category: "islamic" },
  { name: "🕌 Imam Ali — Najaf", lat: 32.0006, lng: 44.3147, category: "islamic" },
  { name: "🕌 Imam Husein — Karbala", lat: 32.6164, lng: 44.0322, category: "islamic" },
  { name: "🕌 Xhamia Blu — Stamboll", lat: 41.0054, lng: 28.9768, category: "islamic" },
  { name: "🕌 Sheikh Zayed — Abu Dhabi", lat: 24.4128, lng: 54.4748, category: "islamic" },
  { name: "🕌 Hassan II — Kazablanka", lat: 33.6082, lng: -7.6326, category: "islamic" },
  { name: "🕌 Et'hem Bey — Tiranë", lat: 41.3275, lng: 19.8189, category: "islamic" },
  { name: "📚 Timbuktu", lat: 16.7666, lng: -3.0026, category: "islamic" },
  { name: "🕌 Sulejmanije — Stamboll", lat: 41.0161, lng: 28.9639, category: "islamic" },
  { name: "🕌 Xhamia e Kordobës", lat: 37.8790, lng: -4.7794, category: "islamic" },
  { name: "🕌 Badshahi — Lahore", lat: 31.5880, lng: 74.3104, category: "islamic" },
  { name: "🕌 Faisal — Islamabad", lat: 33.7295, lng: 73.0372, category: "islamic" },
  { name: "🕌 Xhamia e Kairos (Al-Azhar)", lat: 30.0459, lng: 31.2625, category: "islamic" },
  { name: "🕌 Xhamia Bibi-Khanym — Samarkand", lat: 39.6606, lng: 66.9758, category: "islamic" },
  { name: "🕌 Kubbet'us-Sahra — Kudus", lat: 31.7781, lng: 35.2354, category: "islamic" },

  // 🗼 Monumente botërore
  { name: "🗼 Kulla Eiffel — Paris", lat: 48.8584, lng: 2.2945, category: "world" },
  { name: "🗽 Statuja e Lirisë — New York", lat: 40.6892, lng: -74.0445, category: "world" },
  { name: "🏟️ Koloseu — Romë", lat: 41.8902, lng: 12.4922, category: "world" },
  { name: "🏯 Muri i Madh — Kinë", lat: 40.4319, lng: 116.5704, category: "world" },
  { name: "🕌 Shën Sofia — Stamboll", lat: 41.0086, lng: 28.9802, category: "world" },
  { name: "🏝️ Burj Khalifa — Dubai", lat: 25.1972, lng: 55.2744, category: "world" },
  { name: "🗿 Machu Picchu — Peru", lat: -13.1631, lng: -72.5450, category: "world" },
  { name: "🛕 Taj Mahal — Indi", lat: 27.1751, lng: 78.0421, category: "world" },
  { name: "⛪ Sagrada Familia — Barcelonë", lat: 41.4036, lng: 2.1744, category: "world" },
  { name: "🏛️ Akropoli — Athinë", lat: 37.9715, lng: 23.7267, category: "world" },
  { name: "🎡 London Eye — Londër", lat: 51.5033, lng: -0.1196, category: "world" },
  { name: "🌉 Golden Gate — San Francisco", lat: 37.8199, lng: -122.4783, category: "world" },
  { name: "🗼 Kulla e Tokios", lat: 35.6586, lng: 139.7454, category: "world" },
  { name: "🏛️ Brandenburg Gate — Berlin", lat: 52.5163, lng: 13.3777, category: "world" },
  { name: "🕍 Notre-Dame — Paris", lat: 48.8530, lng: 2.3499, category: "world" },
  { name: "🗿 Krishti Çlirimtar — Rio", lat: -22.9519, lng: -43.2105, category: "world" },
  { name: "🏛️ Pantheon — Romë", lat: 41.8986, lng: 12.4769, category: "world" },
  { name: "🕌 Kremlin — Moskë", lat: 55.7520, lng: 37.6175, category: "world" },
  { name: "🏛️ Piramidat e Gizës", lat: 29.9792, lng: 31.1342, category: "world" },
  { name: "🦁 Sfinksi i Madh — Egjipt", lat: 29.9753, lng: 31.1376, category: "world" },
  { name: "🏛️ Petra — Jordani", lat: 30.3285, lng: 35.4444, category: "world" },
  { name: "🗽 Big Ben — Londër", lat: 51.5007, lng: -0.1246, category: "world" },
  { name: "🌉 Tower Bridge — Londër", lat: 51.5055, lng: -0.0754, category: "world" },
  { name: "🏰 Kalaja e Pragës", lat: 50.0909, lng: 14.4006, category: "world" },
  { name: "🏰 Neuschwanstein — Gjermani", lat: 47.5576, lng: 10.7498, category: "world" },
  { name: "🗼 CN Tower — Toronto", lat: 43.6426, lng: -79.3871, category: "world" },
  { name: "🏛️ Casa Milà — Barcelonë", lat: 41.3954, lng: 2.1619, category: "world" },
  { name: "🏛️ Versailles — Francë", lat: 48.8049, lng: 2.1204, category: "world" },
  { name: "🏛️ Angkor Wat — Kamboxhia", lat: 13.4125, lng: 103.8670, category: "world" },
  { name: "🛕 Borobudur — Indonezi", lat: -7.6079, lng: 110.2038, category: "world" },
  { name: "🗿 Stonehenge — Angli", lat: 51.1789, lng: -1.8262, category: "world" },
  { name: "🏛️ Alhambra — Granada", lat: 37.1761, lng: -3.5881, category: "world" },
  { name: "🌋 Mount Rushmore — SHBA", lat: 43.8791, lng: -103.4591, category: "world" },
  { name: "🗼 Space Needle — Seattle", lat: 47.6205, lng: -122.3493, category: "world" },
  { name: "🏛️ Forbidden City — Pekin", lat: 39.9163, lng: 116.3972, category: "world" },
  { name: "🏛️ Hagia Sophia — Stamboll", lat: 41.0086, lng: 28.9802, category: "world" },
  { name: "🏰 Edinburgh Castle", lat: 55.9486, lng: -3.1999, category: "world" },
  { name: "🏰 Mont Saint-Michel — Francë", lat: 48.6361, lng: -1.5115, category: "world" },
  { name: "🏛️ Trevi Fountain — Romë", lat: 41.9009, lng: 12.4833, category: "world" },
  { name: "🛕 Wat Pho — Bangkok", lat: 13.7465, lng: 100.4927, category: "world" },
  { name: "🏯 Himeji Castle — Japoni", lat: 34.8394, lng: 134.6939, category: "world" },
  { name: "🏛️ Buckingham Palace — Londër", lat: 51.5014, lng: -0.1419, category: "world" },
  { name: "🏛️ White House — Washington", lat: 38.8977, lng: -77.0365, category: "world" },
  { name: "🗽 Hollywood Sign — LA", lat: 34.1341, lng: -118.3215, category: "world" },
  { name: "🏛️ Atomium — Bruksel", lat: 50.8949, lng: 4.3415, category: "world" },
  { name: "🏛️ Leaning Tower — Pisa", lat: 43.7230, lng: 10.3966, category: "world" },

  // 🌄 Natyrë
  { name: "🏔️ Mount Everest — Bazë", lat: 28.0026, lng: 86.8528, category: "nature" },
  { name: "🌋 Grand Canyon — SHBA", lat: 36.0544, lng: -112.1401, category: "nature" },
  { name: "🏞️ Niagara Falls", lat: 43.0962, lng: -79.0377, category: "nature" },
  { name: "🌅 Santorini — Greqi", lat: 36.3932, lng: 25.4615, category: "nature" },
  { name: "🏖️ Maldivet", lat: 3.2028, lng: 73.2207, category: "nature" },
  { name: "🌳 Amazon — Manaus", lat: -3.1190, lng: -60.0217, category: "nature" },
  { name: "🏔️ Alpet Zvicerane — Matterhorn", lat: 45.9763, lng: 7.6586, category: "nature" },
  { name: "🌊 Great Barrier Reef", lat: -16.7000, lng: 145.9667, category: "nature" },
  { name: "💦 Iguazu Falls — Brazil/Argjentinë", lat: -25.6953, lng: -54.4367, category: "nature" },
  { name: "🏝️ Bora Bora", lat: -16.5004, lng: -151.7415, category: "nature" },
  { name: "🌋 Vullkani Kilauea — Havai", lat: 19.4069, lng: -155.2834, category: "nature" },
  { name: "🏞️ Plitvice — Kroaci", lat: 44.8654, lng: 15.5820, category: "nature" },
  { name: "🏔️ Fjordet — Norvegji", lat: 60.8694, lng: 7.0667, category: "nature" },
  { name: "🌵 Sahara — Maroc", lat: 31.0801, lng: -4.0133, category: "nature" },
  { name: "🦁 Serengeti — Tanzani", lat: -2.3333, lng: 34.8333, category: "nature" },
  { name: "🏔️ Liqeni i Ohrit", lat: 41.0297, lng: 20.7080, category: "nature" },
  { name: "🏖️ Ksamil — Shqipëri", lat: 39.7672, lng: 20.0014, category: "nature" },
  { name: "🏔️ Theth — Alpet Shqiptare", lat: 42.3933, lng: 19.7669, category: "nature" },
  { name: "🏞️ Lake Bled — Slloveni", lat: 46.3625, lng: 14.0883, category: "nature" },
  { name: "🌋 Vullkani Fuji — Japoni", lat: 35.3606, lng: 138.7274, category: "nature" },
  { name: "🏔️ Banff — Kanada", lat: 51.4968, lng: -115.9281, category: "nature" },
  { name: "🏖️ Whitehaven Beach — Australi", lat: -20.2814, lng: 149.0381, category: "nature" },
  { name: "🌊 Cliffs of Moher — Irlandë", lat: 52.9716, lng: -9.4309, category: "nature" },
  { name: "🏔️ Cappadocia — Turqi", lat: 38.6431, lng: 34.8289, category: "nature" },
  { name: "🏞️ Yellowstone — SHBA", lat: 44.4280, lng: -110.5885, category: "nature" },
  { name: "🏖️ Phi Phi Islands — Tajlandë", lat: 7.7407, lng: 98.7784, category: "nature" },
  { name: "🌅 Uluru (Ayers Rock) — Australi", lat: -25.3444, lng: 131.0369, category: "nature" },
  { name: "🏔️ Dolomitet — Itali", lat: 46.4102, lng: 11.8440, category: "nature" },
  { name: "🏞️ Liqeni i Shkodrës", lat: 42.1566, lng: 19.5450, category: "nature" },
  { name: "🏔️ Kanioni i Osumit — Shqipëri", lat: 40.4906, lng: 20.2469, category: "nature" },
  { name: "🏞️ Liqenet e Lurës", lat: 41.7811, lng: 20.1953, category: "nature" },
  { name: "🏖️ Dhërmi — Shqipëri", lat: 40.1442, lng: 19.6478, category: "nature" },

  // 🌆 Qytete të frekuentuara
  { name: "🌆 Times Square — New York", lat: 40.7580, lng: -73.9855, category: "city" },
  { name: "🚦 Shibuya — Tokio", lat: 35.6595, lng: 139.7004, category: "city" },
  { name: "🎰 Las Vegas Strip", lat: 36.1147, lng: -115.1728, category: "city" },
  { name: "🌉 Sydney Opera", lat: -33.8568, lng: 151.2153, category: "city" },
  { name: "🏙️ Singapore Marina Bay", lat: 1.2834, lng: 103.8607, category: "city" },
  { name: "🕌 Sheshi i Kuq — Moskë", lat: 55.7539, lng: 37.6208, category: "city" },
  { name: "🌃 Hong Kong Skyline", lat: 22.2793, lng: 114.1628, category: "city" },
  { name: "🏛️ Sheshi Skënderbej — Tiranë", lat: 41.3281, lng: 19.8187, category: "city" },
  { name: "🌉 Brooklyn Bridge — NYC", lat: 40.7061, lng: -73.9969, category: "city" },
  { name: "🏙️ Champs-Élysées — Paris", lat: 48.8698, lng: 2.3079, category: "city" },
  { name: "🏙️ Piccadilly Circus — Londër", lat: 51.5101, lng: -0.1342, category: "city" },
  { name: "🏙️ Plaza Mayor — Madrid", lat: 40.4155, lng: -3.7074, category: "city" },
  { name: "🏙️ Trafalgar Square — Londër", lat: 51.5080, lng: -0.1281, category: "city" },
  { name: "🏙️ Sheshi i Shën Markut — Venecia", lat: 45.4341, lng: 12.3388, category: "city" },
  { name: "🏙️ Sheshi i Kuq — Pekin (Tiananmen)", lat: 39.9055, lng: 116.3976, category: "city" },
  { name: "🏙️ Dam Square — Amsterdam", lat: 52.3731, lng: 4.8926, category: "city" },
  { name: "🏙️ Wenceslas Square — Pragë", lat: 50.0810, lng: 14.4267, category: "city" },
  { name: "🏙️ Sheshi Taksim — Stamboll", lat: 41.0370, lng: 28.9850, category: "city" },
  { name: "🏙️ Old Quebec — Kanada", lat: 46.8129, lng: -71.2080, category: "city" },
  { name: "🏙️ Marina Beach — Dubai", lat: 25.0785, lng: 55.1390, category: "city" },
  { name: "🏙️ Bulevardi Dëshmorët — Prishtinë", lat: 42.6629, lng: 21.1655, category: "city" },
  { name: "🏙️ Sheshi Liria — Shkup", lat: 41.9962, lng: 21.4316, category: "city" },
  { name: "🌃 Marina Bay Sands — Singapor", lat: 1.2834, lng: 103.8607, category: "city" },
  { name: "🌆 Burj Al Arab — Dubai", lat: 25.1413, lng: 55.1853, category: "city" },
  { name: "🌃 Ginza — Tokio", lat: 35.6717, lng: 139.7650, category: "city" },
  { name: "🌆 Gangnam — Seul", lat: 37.4979, lng: 127.0276, category: "city" },
  { name: "🌃 Bourbon Street — New Orleans", lat: 29.9590, lng: -90.0670, category: "city" },
  { name: "🌉 Charles Bridge — Pragë", lat: 50.0865, lng: 14.4114, category: "city" },
  { name: "🏙️ Grand Bazaar — Stamboll", lat: 41.0108, lng: 28.9680, category: "city" },
  { name: "🌆 La Rambla — Barcelonë", lat: 41.3818, lng: 2.1716, category: "city" },
  { name: "🌃 Lan Kwai Fong — Hong Kong", lat: 22.2811, lng: 114.1554, category: "city" },
  { name: "🌆 Pjaca — Split, Kroaci", lat: 43.5081, lng: 16.4402, category: "city" },
  { name: "🏙️ Sheshi Maqedonia — Shkup", lat: 41.9959, lng: 21.4319, category: "city" },
  { name: "🌃 Newa Promenade — Shën Petersburg", lat: 59.9398, lng: 30.3146, category: "city" },
];

interface Props {
  apiKey: string;
  onTeleport: (lat: number, lng: number, name: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<FamousPlace["category"], string> = {
  islamic: "🕋 Vende të shenjta islame",
  world: "🗼 Monumente botërore",
  nature: "🌄 Natyrë mahnitëse",
  city: "🌆 Qytete të frekuentuara",
};

const CATEGORY_ORDER: FamousPlace["category"][] = ["islamic", "world", "nature", "city"];

function thumbUrl(p: FamousPlace, apiKey: string) {
  const heading = p.heading ?? 0;
  return `https://maps.googleapis.com/maps/api/streetview?size=160x96&location=${p.lat},${p.lng}&fov=90&heading=${heading}&pitch=0&key=${encodeURIComponent(apiKey)}`;
}

export function FamousPlaces({ apiKey, onTeleport, onClose }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return FAMOUS_PLACES;
    return FAMOUS_PLACES.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  return (
    <div className="fixed top-20 right-4 bottom-4 w-96 z-20 glass-panel rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Vende të famshme</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-3 py-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kërko vend..."
            className="pl-9 h-9 bg-card/40 border-border/40"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">
          {CATEGORY_ORDER.map((cat) => {
            const items = filtered.filter((p) => p.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {CATEGORY_LABELS[cat]}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => onTeleport(p.lat, p.lng, p.name)}
                      className="group text-left rounded-lg overflow-hidden bg-card/40 hover:bg-accent/50 border border-border/40 transition-all hover:border-primary/40"
                    >
                      <div className="aspect-[5/3] bg-muted overflow-hidden">
                        <img
                          src={thumbUrl(p, apiKey)}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium leading-tight line-clamp-2">{p.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Asnjë rezultat për "{query}"
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
