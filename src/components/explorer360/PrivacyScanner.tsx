import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scanPanoramaPrivacy, type Detection } from "@/lib/privacy-scan.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Shield, ShieldAlert, ShieldCheck, Plus, Trash2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

const COLORS: Record<Detection["type"], string> = {
  face: "#ef4444",
  plate: "#f59e0b",
  document: "#3b82f6",
  screen: "#8b5cf6",
  other: "#10b981",
};

const LABELS: Record<Detection["type"], string> = {
  face: "Fytyrë",
  plate: "Targa",
  document: "Dokument",
  screen: "Ekran",
  other: "Tjetër",
};

interface Props {
  file: File;
  onCancel: () => void;
  onApprove: (cleanedBlob: Blob, scanReport: { detections: Detection[]; blurRadius: number; manualCount: number }) => void;
}

/**
 * Loads the chosen panorama into a canvas, sends a downscaled copy to
 * Gemini Vision via the privacy-scan server fn, lets the user review/edit
 * the detected boxes, and exports a blurred JPEG ready for upload.
 */
export function PrivacyScanner({ file, onCancel, onApprove }: Props) {
  const scan = useServerFn(scanPanoramaPrivacy);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [manualAdded, setManualAdded] = useState(0);
  const [blurRadius, setBlurRadius] = useState(28);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      redraw();
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => { redraw(); /* eslint-disable-next-line */ }, [detections, blurRadius, dragEnd]);

  const redraw = () => {
    const img = imgRef.current;
    const cnv = previewRef.current;
    if (!img || !cnv) return;
    const maxW = 880;
    const scale = Math.min(1, maxW / img.naturalWidth);
    cnv.width = Math.round(img.naturalWidth * scale);
    cnv.height = Math.round(img.naturalHeight * scale);
    const ctx = cnv.getContext("2d")!;
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.drawImage(img, 0, 0, cnv.width, cnv.height);

    // Apply blur preview on each detection
    detections.forEach((d) => {
      const x = d.x * cnv.width;
      const y = d.y * cnv.height;
      const w = d.w * cnv.width;
      const h = d.h * cnv.height;
      const r = Math.max(4, (blurRadius * cnv.width) / img.naturalWidth);
      ctx.save();
      ctx.filter = `blur(${r}px)`;
      ctx.drawImage(cnv, x, y, w, h, x, y, w, h);
      ctx.restore();
      // Outline + label
      ctx.strokeStyle = COLORS[d.type];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = COLORS[d.type];
      ctx.font = "11px ui-sans-serif, system-ui";
      const tag = `${LABELS[d.type]} ${(d.confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(tag).width + 6;
      ctx.fillRect(x, Math.max(0, y - 14), tw, 14);
      ctx.fillStyle = "white";
      ctx.fillText(tag, x + 3, Math.max(11, y - 3));
    });

    // In-progress drag rectangle
    if (dragStart && dragEnd) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      const x = Math.min(dragStart.x, dragEnd.x);
      const y = Math.min(dragStart.y, dragEnd.y);
      const w = Math.abs(dragEnd.x - dragStart.x);
      const h = Math.abs(dragEnd.y - dragStart.y);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  const runScan = async () => {
    const img = imgRef.current;
    if (!img) return;
    setLoading(true);
    try {
      // Downscale to ~1280px wide for AI to keep request small & fast
      const scaleW = Math.min(1280, img.naturalWidth);
      const ratio = scaleW / img.naturalWidth;
      const tmp = document.createElement("canvas");
      tmp.width = scaleW;
      tmp.height = Math.round(img.naturalHeight * ratio);
      tmp.getContext("2d")!.drawImage(img, 0, 0, tmp.width, tmp.height);
      const dataUrl = tmp.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      const res = await scan({ data: { imageBase64: base64, mimeType: "image/jpeg" } });
      setDetections(res.detections);
      setScanned(true);
      if (res.detections.length === 0) {
        toast.success("AI nuk gjeti asgjë private — i pastër!");
      } else {
        toast.warning(`AI gjeti ${res.detections.length} element(e) për blur. Rishiko dhe konfirmo.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Skanimi dështoi");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setDragStart({ x: e.clientX - r.left, y: e.clientY - r.top });
    setDragEnd({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDragEnd({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const handleMouseUp = () => {
    if (!dragStart || !dragEnd || !previewRef.current) { setDragStart(null); setDragEnd(null); return; }
    const cnv = previewRef.current;
    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const w = Math.abs(dragEnd.x - dragStart.x);
    const h = Math.abs(dragEnd.y - dragStart.y);
    if (w > 6 && h > 6) {
      setDetections((d) => [
        ...d,
        { type: "other", x: x / cnv.width, y: y / cnv.height, w: w / cnv.width, h: h / cnv.height, confidence: 1, note: "manual" },
      ]);
      setManualAdded((n) => n + 1);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const removeDetection = (i: number) => setDetections((d) => d.filter((_, idx) => idx !== i));

  const exportBlob = async () => {
    const img = imgRef.current;
    const out = canvasRef.current;
    if (!img || !out) return;
    setExporting(true);
    try {
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      detections.forEach((d) => {
        const x = d.x * out.width;
        const y = d.y * out.height;
        const w = d.w * out.width;
        const h = d.h * out.height;
        ctx.save();
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(out, x, y, w, h, x, y, w, h);
        ctx.restore();
      });
      const blob: Blob | null = await new Promise((r) => out.toBlob(r, "image/jpeg", 0.9));
      if (!blob) throw new Error("Eksporti i kanvasit dështoi");
      onApprove(blob, { detections, blurRadius, manualCount: manualAdded });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eksporti dështoi");
    } finally {
      setExporting(false);
    }
  };

  const highConf = detections.filter((d) => d.confidence >= 0.7).length;
  const blockedUntilScan = !scanned;
  const blockedByUnreviewed = highConf > 0 && detections.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" /> Skanim Privatësie (AI)
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-auto p-4 grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted relative">
              <canvas
                ref={previewRef}
                className="w-full h-auto cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { setDragStart(null); setDragEnd(null); }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <p className="text-xs text-muted-foreground">
              Tërhiq miun mbi kanvas për të shtuar manualisht një zonë blur. Klikoni "X" tek lista djathtas për të fshirë një kuti.
            </p>
          </div>

          <aside className="space-y-4">
            <Button onClick={runScan} disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Duke skanuar…</> : <><Sparkles className="h-4 w-4 mr-1" /> {scanned ? "Riskano me AI" : "Skano me AI"}</>}
            </Button>

            <div>
              <Label className="text-xs flex items-center justify-between mb-1.5">
                Intensiteti i blur <span className="text-muted-foreground">{blurRadius}px</span>
              </Label>
              <Slider value={[blurRadius]} min={6} max={80} step={2} onValueChange={(v) => setBlurRadius(v[0])} />
            </div>

            <div className="rounded-lg border bg-muted/40 p-2 max-h-[36vh] overflow-y-auto">
              <div className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                {detections.length === 0 ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />}
                Kutitë ({detections.length})
              </div>
              {detections.length === 0 && <p className="text-xs text-muted-foreground">Asnjë kuti. {scanned ? "Imazhi është i pastër." : "Kliko 'Skano me AI'."}</p>}
              <ul className="space-y-1">
                {detections.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.type] }} />
                    <span className="flex-1 truncate">{LABELS[d.type]} · {(d.confidence * 100).toFixed(0)}%</span>
                    <button onClick={() => removeDetection(i)} className="text-destructive opacity-70 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                  </li>
                ))}
              </ul>
              {manualAdded > 0 && <p className="text-[10px] text-muted-foreground mt-1.5"><Plus className="h-2.5 w-2.5 inline" /> {manualAdded} manuale</p>}
            </div>
          </aside>
        </div>

        <footer className="border-t px-4 py-3 flex items-center justify-between gap-2 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {blockedUntilScan ? "⚠️ Skano me AI përpara ngarkimit." : detections.length === 0 ? "✓ I pastër — gati për ngarkim." : `${detections.length} kuti do bëhen blur në imazhin final.`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={exporting}>Anulo</Button>
            <Button onClick={exportBlob} disabled={exporting || blockedUntilScan || blockedByUnreviewed}>
              {exporting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Duke eksportuar…</> : <>Apliko blur & ngarko</>}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}