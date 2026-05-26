import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Accessibility, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCommand?: (cmd: string) => void;
}

/**
 * Akses për të verbërit / VR:
 *  - "Lexim me prekje": kur vendos gishtin/mouse-in mbi një element, lexohet teksti me zë (sq).
 *  - "Komanda me zë": dëgjon mikrofonin (Web Speech API) dhe ekzekuton komanda të thjeshta.
 *    Punon në Meta Quest Browser, Chrome Android, iOS Safari (me leje mikrofoni).
 */
export function AccessibilityPanel({ onCommand }: Props) {
  const [open, setOpen] = useState(false);
  const [readOnTouch, setReadOnTouch] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  const speak = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const trimmed = text.trim().slice(0, 240);
    if (!trimmed) return;
    const now = Date.now();
    if (trimmed === lastSpokenRef.current && now - lastTimeRef.current < 1500) return;
    lastSpokenRef.current = trimmed;
    lastTimeRef.current = now;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = "sq-AL";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }, []);

  // Read-on-touch listener
  useEffect(() => {
    if (!readOnTouch) {
      window.speechSynthesis?.cancel();
      return;
    }
    const getText = (el: Element | null): string => {
      if (!el) return "";
      const aria = el.getAttribute?.("aria-label");
      if (aria) return aria;
      const title = el.getAttribute?.("title");
      if (title) return title;
      const txt = (el as HTMLElement).innerText || el.textContent || "";
      return txt.replace(/\s+/g, " ").trim();
    };
    const handler = (e: Event) => {
      const tgt = e.target as Element | null;
      if (!tgt) return;
      // Find nearest meaningful element
      const el = (tgt.closest("button, a, [role='button'], [aria-label], h1, h2, h3, h4, label, p, li, input, textarea") || tgt) as Element;
      const text = getText(el);
      if (text) speak(text);
    };
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener("pointerover", handler, opts);
    window.addEventListener("touchstart", handler, opts);
    window.addEventListener("focusin", handler, opts);
    return () => {
      window.removeEventListener("pointerover", handler, opts);
      window.removeEventListener("touchstart", handler, opts);
      window.removeEventListener("focusin", handler, opts);
    };
  }, [readOnTouch, speak]);

  // Voice commands
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Shfletuesi nuk mbështet komandat me zë");
      return;
    }
    const rec = new SR();
    rec.lang = "sq-AL";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (ev: any) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (!res.isFinal) continue;
        const raw = res[0].transcript.toLowerCase().trim();
        speak("Komanda: " + raw);
        onCommand?.(raw);
      }
    };
    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      toast.error("Gabim zëri: " + e.error);
    };
    rec.onend = () => {
      // auto-restart if still wanted
      if (recognitionRef.current === rec) {
        try { rec.start(); } catch {}
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      speak("Komandat me zë u aktivizuan");
    } catch (e) {
      toast.error("Nuk arrita të nis mikrofonin");
    }
  }, [onCommand, speak]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.stop(); } catch {}
    setListening(false);
    speak("Komandat me zë u ndalën");
  }, [speak]);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-11 w-11 glass-panel"
        onClick={() => setOpen((o) => !o)}
        title="Akses për të verbërit"
        aria-label="Hap panelin e aksesit për të verbërit"
      >
        <Accessibility className="h-5 w-5" />
      </Button>

      {open && (
        <div className="absolute top-20 right-4 z-30 glass-panel rounded-xl p-4 w-72 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Accessibility className="h-4 w-4" /> Akses
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground text-xs hover:text-foreground"
              aria-label="Mbyll"
            >
              ✕
            </button>
          </div>

          <Button
            onClick={() => {
              const next = !readOnTouch;
              setReadOnTouch(next);
              if (next) speak("Leximi me prekje u aktivizua");
              else window.speechSynthesis?.cancel();
            }}
            variant={readOnTouch ? "default" : "secondary"}
            className="w-full justify-start gap-2"
            aria-pressed={readOnTouch}
          >
            {readOnTouch ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Lexim me prekje: {readOnTouch ? "ON" : "OFF"}
          </Button>

          <Button
            onClick={() => (listening ? stopListening() : startListening())}
            variant={listening ? "default" : "secondary"}
            className="w-full justify-start gap-2"
            aria-pressed={listening}
          >
            {listening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            Komanda me zë: {listening ? "ON" : "OFF"}
          </Button>

          <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
            <p className="font-semibold mb-1">Komanda të disponueshme:</p>
            <ul className="space-y-0.5">
              <li>• "hap kuranin" / "mbyll kuranin"</li>
              <li>• "hap drejtime" / "mbyll drejtime"</li>
              <li>• "sugjero vend"</li>
              <li>• "vr" / "syze" — hap VR</li>
              <li>• "ndalo" — ndalo leximin</li>
            </ul>
            <p className="mt-2 italic">Funksionon në Meta Quest Browser, Chrome Android, iOS Safari.</p>
          </div>
        </div>
      )}
    </>
  );
}