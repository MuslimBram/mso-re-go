import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Play, Pause, SkipBack, SkipForward, Shuffle, Rewind } from "lucide-react";

// All 114 surahs (transliteration)
const SURAHS = [
  "Al-Fatiha","Al-Baqarah","Al-Imran","An-Nisa","Al-Maidah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus",
  "Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Ta-Ha",
  "Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum",
  "Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir",
  "Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf",
  "Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadilah","Al-Hashr","Al-Mumtahanah",
  "As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij",
  "Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","Abasa",
  "At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad",
  "Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat",
  "Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr",
  "Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas",
];

// Reciters from mp3quran.net (free distribution). { folder, server }
const RECITERS = [
  { id: "afs", name: "Mishary Alafasy", server: 8 },
  { id: "husr", name: "Mahmoud Al-Husary", server: 13 },
  { id: "sds", name: "Abdurrahman As-Sudais", server: 11 },
  { id: "ajm", name: "Ahmed Al-Ajmi", server: 10 },
  { id: "basit", name: "Abdul Basit", server: 7 },
  { id: "s_gmd", name: "Saud Al-Shuraim", server: 7 },
  { id: "minsh", name: "Mohamed Siddiq Al-Minshawi", server: 10 },
  { id: "maher", name: "Maher Al-Muaiqly", server: 12 },
  { id: "yasser", name: "Yasser Ad-Dossari", server: 11 },
  { id: "h_dukhain", name: "Haitham Ad-Dukhain", server: 16 },
];

const pad = (n: number) => String(n).padStart(3, "0");
const trackUrl = (reciter: typeof RECITERS[number], surahNo: number) =>
  `https://server${reciter.server}.mp3quran.net/${reciter.id}/${pad(surahNo)}.mp3`;

interface Props {
  open: boolean;
  onClose: () => void;
  externalVolume?: number;
  onVolumeChange?: (v: number) => void;
  isOwner?: boolean;
}

type UserTrack = { name: string; url: string };

export function QuranPlayer({ open, onClose, externalVolume, onVolumeChange, isOwner }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [reciterIdx, setReciterIdx] = useState(0);
  const [surahIdx, setSurahIdx] = useState(54); // Ar-Rahman by default
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  // -1..−N → user track (index = -1 - i); otherwise surah index 0..113
  const [usingUser, setUsingUser] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [internalVolume, setInternalVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const volume = externalVolume ?? internalVolume;
  const setVolume = (v: number) => {
    setInternalVolume(v);
    onVolumeChange?.(v);
  };

  const reciter = RECITERS[reciterIdx];
  const currentLabel = usingUser !== null
    ? userTracks[usingUser]?.name
    : `${surahIdx + 1}. ${SURAHS[surahIdx]} — ${reciter.name}`;
  const currentUrl = useMemo(() => {
    if (usingUser !== null) return userTracks[usingUser]?.url;
    return trackUrl(reciter, surahIdx + 1);
  }, [usingUser, userTracks, reciter, surahIdx]);

  // Load + autoplay when src changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentUrl) return;
    a.src = currentUrl;
    a.volume = volume;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [currentUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // If browser blocked autoplay, start on first user interaction anywhere
  useEffect(() => {
    const tryStart = () => {
      const a = audioRef.current;
      if (a && a.paused) {
        a.play().then(() => setPlaying(true)).catch(() => {});
      }
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
    };
    window.addEventListener("pointerdown", tryStart, { once: true });
    window.addEventListener("keydown", tryStart, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
    };
  }, []);

  const rewind10 = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime <= 3) {
      prev();
    } else {
      a.currentTime = Math.max(0, a.currentTime - 10);
    }
  };

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const next = () => {
    if (usingUser !== null) {
      if (usingUser + 1 < userTracks.length) setUsingUser(usingUser + 1);
      else { setUsingUser(null); setSurahIdx(0); }
      return;
    }
    if (shuffle) {
      setSurahIdx(Math.floor(Math.random() * 114));
    } else {
      setSurahIdx((i) => (i + 1) % 114);
    }
  };
  const prev = () => {
    if (usingUser !== null) {
      if (usingUser > 0) setUsingUser(usingUser - 1);
      return;
    }
    setSurahIdx((i) => (i - 1 + 114) % 114);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => {}); }
    else { a.pause(); setPlaying(false); }
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newOnes: UserTrack[] = Array.from(files).map((f) => ({
      name: f.name.replace(/\.[^.]+$/, ""),
      url: URL.createObjectURL(f),
    }));
    setUserTracks((t) => [...newOnes, ...t]);
    setUsingUser(0);
  };

  return (
    <>
      {/* Always-mounted audio element so playback persists when panel is closed */}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={next}
        onError={() => next()}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        preload="auto"
      />

      {open && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[min(460px,92vw)] glass-panel rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">📖 Kuran — Dëgjim i vazhdueshëm</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Mbyll">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Reciter selector */}
          <label className="block text-[11px] text-muted-foreground mb-1">Recituesi</label>
          <select
            value={reciterIdx}
            onChange={(e) => { setReciterIdx(Number(e.target.value)); setUsingUser(null); }}
            className="w-full mb-3 px-2 py-1.5 rounded-lg bg-background border border-border text-xs"
          >
            {RECITERS.map((r, i) => (
              <option key={r.id} value={i}>{r.name}</option>
            ))}
          </select>

          {/* Transport */}
          <div className="flex items-center gap-2 mb-3">
            <Button onClick={rewind10} size="icon" variant="ghost" className="h-9 w-9" aria-label="Mbrapa 10 sek" title="Mbrapa 10 sek">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button onClick={prev} size="icon" variant="ghost" className="h-9 w-9" aria-label="E mëparshmja">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button onClick={toggle} size="icon" className="h-11 w-11 rounded-full" aria-label={playing ? "Pauzo" : "Luaj"}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button onClick={next} size="icon" variant="ghost" className="h-9 w-9" aria-label="Tjetra">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShuffle((s) => !s)}
              size="icon"
              variant={shuffle ? "default" : "ghost"}
              className="h-9 w-9"
              aria-label="Rastësisht"
              title="Rastësisht"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0 ml-1">
              <p className="text-xs font-medium truncate">{currentLabel}</p>
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full mt-1 accent-primary"
                aria-label="Volumi"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div
              onClick={onSeek}
              className="relative h-2 w-full rounded-full bg-muted cursor-pointer overflow-hidden"
              role="slider"
              aria-label="Pozicioni i recitimit"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(currentTime)}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-150"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* User uploads */}
          {userTracks.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-muted-foreground mb-1">Ngarkimet e mia</p>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {userTracks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setUsingUser(i)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] truncate transition-colors ${
                      usingUser === i ? "bg-primary/20 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All 114 surahs */}
          <p className="text-[11px] text-muted-foreground mb-1">Suret (114)</p>
          <div className="max-h-56 overflow-y-auto space-y-0.5 mb-3 pr-1">
            {SURAHS.map((name, i) => (
              <button
                key={i}
                onClick={() => { setUsingUser(null); setSurahIdx(i); }}
                className={`w-full text-left px-2 py-1 rounded-md text-[11px] flex items-center gap-2 transition-colors ${
                  usingUser === null && i === surahIdx ? "bg-primary/20 text-primary" : "hover:bg-muted"
                }`}
              >
                <span className="w-6 text-right tabular-nums text-muted-foreground">{i + 1}.</span>
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>

          {isOwner && (
            <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 text-xs">
              <Upload className="h-3.5 w-3.5" />
              Ngarko audion tënde (MP3/M4A)
              <input type="file" accept="audio/*" multiple className="hidden" onChange={onUpload} />
            </label>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground text-center">
            Audio vazhdon edhe pasi e mbyll panelin. Suret avancojnë automatikisht.
          </p>
        </div>
      )}
    </>
  );
}