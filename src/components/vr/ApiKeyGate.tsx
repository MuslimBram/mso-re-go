import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGoogleMapsKey } from "@/lib/google-maps-key";
import { Globe2, KeyRound, ExternalLink } from "lucide-react";

interface Props {
  onSubmit: () => void;
}

export function ApiKeyGate({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 20) {
      setError("Çelësi duket i pasaktë. Provo përsëri.");
      return;
    }
    setGoogleMapsKey(trimmed);
    onSubmit();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-y-auto">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.4 0.15 240 / 0.6), transparent 60%), radial-gradient(ellipse at bottom right, oklch(0.5 0.18 200 / 0.4), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-lg mx-4 my-8 p-8 rounded-2xl glass-panel hud-glow">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[oklch(0.6_0.2_240)] to-[oklch(0.5_0.22_280)]">
            <Globe2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VR Explorer</h1>
            <p className="text-sm text-muted-foreground">Eksploro botën në Street View 360°</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Google Maps API Key
            </Label>
            <Input
              id="key"
              type="password"
              placeholder="AIza..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Çelësi ruhet vetëm në browser-in tënd (localStorage). Aktivizo:{" "}
              <strong>Maps JavaScript API</strong>, <strong>Street View Static API</strong>,{" "}
              <strong>Places API</strong>.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Hyr në Eksperiencën VR
          </Button>

          <a
            href="https://console.cloud.google.com/google/maps-apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Merr një API key falas <ExternalLink className="h-3 w-3" />
          </a>
        </form>
      </div>
    </div>
  );
}