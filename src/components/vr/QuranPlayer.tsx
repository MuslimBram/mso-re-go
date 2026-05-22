import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Play, Pause } from "lucide-react";

// Default: Mishary Rashid Alafasy — Surah Ar-Rahman (free Islamic distribution, mp3quran.net)
const DEFAULT_TRACKS = [
  { name: "Ar-Rahman — Mishary Alafasy", url: "https://server8.mp3quran.net/afs/055.mp3" },
  { name: "Al-Mulk — Mishary Alafasy", url: "https://server8.mp3quran.net/afs/067.mp3" },
  { name: "Yasin — Mishary Alafasy", url: "https://server8.mp3quran.net/afs/036.mp3" },
  { name: "Al-Kahf — Mishary Alafasy", url: "https://server8.mp3quran.net/afs/018.mp3" },
  { name: "Al-Fatiha — Mishary Alafasy", url: "https://server8.mp3quran.net/afs/001.mp3" },
];

interface Props {
  onClose: () => void;
}

export function QuranPlayer({ onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = tracks[currentIdx].url;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [currentIdx, tracks]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newOnes = Array.from(files).map((f) => ({
      name: f.name.replace(/\.[^.]+$/, ""),
      url: URL.createObjectURL(f),
    }));
    setTracks((t) => [...newOnes, ...t]);
    setCurrentIdx(0);
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[min(420px,90vw)] glass-panel rounded-2xl p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">📖 Kuran — Dëgjim</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Mbyll">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button onClick={toggle} size="icon" className="h-10 w-10 rounded-full" aria-label={playing ? "Pauzo" : "Luaj"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{tracks[currentIdx]?.name}</p>
          <audio ref={audioRef} controls className="w-full h-8 mt-1" />
        </div>
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
        {tracks.map((t, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              i === currentIdx ? "bg-primary/20 text-primary" : "hover:bg-muted"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 text-xs">
        <Upload className="h-3.5 w-3.5" />
        Ngarko audio (MP3/M4A)
        <input type="file" accept="audio/*" multiple className="hidden" onChange={onUpload} />
      </label>
    </div>
  );
}