import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
}

export function GpsBadge({ lat, lng }: Props) {
  const [copied, setCopied] = useState(false);

  const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={copy}
      title="Kopjo koordinatat GPS"
      className="fixed top-20 left-4 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-mono text-white hover:bg-black/80"
    >
      <MapPin className="h-3 w-3" />
      <span>{text}</span>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  );
}