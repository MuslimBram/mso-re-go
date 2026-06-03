import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RefreshCw, CheckCircle2, Clock, XCircle, MapPin, Compass } from "lucide-react";
import { toast } from "sonner";

interface SceneRow {
  id: string;
  name: string;
  panorama_url: string | null;
  street_view_lat: number | null;
  street_view_lng: number | null;
  heading: number;
  privacy_approved: boolean;
  gsv_pano_id: string | null;
  gsv_url: string | null;
}
interface QueueRow {
  id: string;
  scene_id: string;
  status: string;
  error: string | null;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { v: string; icon: JSX.Element; label: string }> = {
    published: { v: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" />, label: "E publikuar" },
    approved: { v: "secondary", icon: <Clock className="h-3 w-3 mr-1" />, label: "E aprovuar" },
    publishing: { v: "secondary", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, label: "Po publikohet" },
    pending_review: { v: "outline", icon: <Clock className="h-3 w-3 mr-1" />, label: "Pret aprovim" },
    rejected: { v: "destructive", icon: <XCircle className="h-3 w-3 mr-1" />, label: "Refuzuar" },
  };
  const m = map[status] ?? { v: "outline", icon: <Clock className="h-3 w-3 mr-1" />, label: status };
  return <Badge variant={m.v as never} className="text-[10px]">{m.icon}{m.label}</Badge>;
}

export function GsvPublishPanel({ tourId }: { tourId: string }) {
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ss } = await supabase
      .from("tour_scenes")
      .select("id,name,panorama_url,street_view_lat,street_view_lng,heading,privacy_approved,gsv_pano_id,gsv_url")
      .eq("tour_id", tourId)
      .order("order_index");
    const sceneIds = (ss ?? []).map((s) => s.id);
    const { data: qq } = sceneIds.length
      ? await supabase.from("gsv_publish_queue").select("*").in("scene_id", sceneIds).order("updated_at", { ascending: false })
      : { data: [] as QueueRow[] };
    setScenes((ss as SceneRow[]) ?? []);
    setQueue((qq as QueueRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tourId]);

  const latestStatus = (sceneId: string) => {
    const q = queue.find((q) => q.scene_id === sceneId);
    return q?.status ?? null;
  };

  const requestPublish = async (scene: SceneRow) => {
    const blockers: string[] = [];
    if (!scene.panorama_url) blockers.push("panoramë e pastruar");
    if (!scene.privacy_approved) blockers.push("aprovim privatësie");
    if (scene.street_view_lat == null || scene.street_view_lng == null) blockers.push("vendndodhje (lat/lng)");
    if (blockers.length) { toast.error(`Mungon: ${blockers.join(", ")}`); return; }
    setBusy(scene.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("gsv_publish_queue").insert({
      scene_id: scene.id,
      requested_by: u.user?.id,
      status: "pending_review",
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("U dërgua për aprovim nga admini");
    load();
  };

  if (loading) return <div className="text-sm text-muted-foreground py-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Duke ngarkuar…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Publikimi në Google Street View ({scenes.length} skena)</h3>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Rifresko</Button>
      </div>
      <ul className="space-y-2">
        {scenes.map((s) => {
          const status = s.gsv_pano_id ? "published" : latestStatus(s.id);
          const hasLoc = s.street_view_lat != null && s.street_view_lng != null;
          return (
            <li key={s.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  {status && <StatusBadge status={status} />}
                  {!s.privacy_approved && <Badge variant="destructive" className="text-[10px]">⚠ pa skanim</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {hasLoc ? `${s.street_view_lat!.toFixed(5)}, ${s.street_view_lng!.toFixed(5)}` : "—"}</span>
                  <span className="flex items-center gap-1"><Compass className="h-3 w-3" /> {Math.round(s.heading)}°</span>
                  {s.gsv_url && <a href={s.gsv_url} target="_blank" rel="noreferrer" className="text-primary underline truncate">Hap në GSV</a>}
                </div>
              </div>
              <Button size="sm" disabled={!!status || busy === s.id} onClick={() => requestPublish(s)}>
                {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" /> Publiko</>}
              </Button>
            </li>
          );
        })}
        {scenes.length === 0 && <li className="text-sm text-muted-foreground text-center py-4">Asnjë skenë.</li>}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Pas dërgimit, kërkesa pret aprovimin nga administratori, pastaj ngarkohet automatikisht në llogarinë qendrore Google Street View (kërkon konfigurimin e Google API në Fazën D).
      </p>
    </div>
  );
}