import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onSelect: (location: { lat: number; lng: number; name: string }) => void;
  ready: boolean;
}

export function SearchBar({ onSelect, ready }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    try {
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["geometry", "name", "formatted_address"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        setLoading(true);
        const name =
          place.name || place.formatted_address || "Vend i panjohur";
        onSelect({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name,
        });
        setTimeout(() => setLoading(false), 600);
      });
      autocompleteRef.current = ac;
    } catch (err) {
      console.error("Places Autocomplete failed to initialize:", err);
    }
  }, [ready, onSelect]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </div>
      <Input
        ref={inputRef}
        placeholder={ready ? "Kërko një vend ose adresë..." : "Duke ngarkuar..."}
        disabled={!ready}
        className="pl-10 h-11 glass-panel border-0"
      />
    </div>
  );
}