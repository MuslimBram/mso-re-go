import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Send, RefreshCw, CheckCircle2, Clock, XCircle, MapPin, Compass,
  Eye, EyeOff, Trash2, RotateCw, AlertTriangle, Globe2, X,
} from "lucide-react";
import { toast } from "sonner";

type GsvStatus =
  | "not_published" | "pending_review" | "approved" | "publishing"
  | "published" | "failed" | "rejected" | "unpublished"
  | "unpublished_remote" | "stale";

interface SceneRow {
  id: string;
  name: string;
  panorama_url: string | null;
  street_view_lat: number | null;
  street_view_lng: number | null;
  heading: number;
  privacy_approved: boolean;
  local_published: boolean;
  gsv_status: GsvStatus;
  gsv_pano_id: string | null;
  gsv_url: string | null;
  gsv_upload_time: string | null;
  gsv_last_error: string | null;
  gsv_attempt_count: number;
  gsv_last_synced_at: string | null;
}
interface QueueRow {
  id: string;
  scene_id: string;
  status: string;
  action: string;
  error: string | null;
  last_error: string | null;
  attempt_count: number;
  updated_at: string;
}

const STATUS_META: Record<GsvStatus, { v: "default" | "secondary" | "outline" | "destructive"; icon: ReactNode; label: string; className?: string }> = {
  not_published:      { v: "outline",     icon: <Globe2 className="h-3 w-3 mr-1" />,              label: "E papublikuar (GSV)" },
  pending_review:     { v: "secondary",   icon: <Clock className="h-3 w-3 mr-1" />,               label: "Pret aprovim" },
  approved:           { v: "secondary",   icon: <Clock className="h-3 w-3 mr-1" />,               label: "E aprovuar" },
  publishing:         { v: "secondary",   icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, label: "Po publikohet" },
  published:          { v: "default",     icon: <CheckCircle2 className="h-3 w-3 mr-1" />,        label: "E publikuar në GSV" },
  failed:             { v: "destructive", icon: <AlertTriangle className="h-3 w-3 mr-1" />,       label: "Dështoi" },
  rejected:           { v: "destructive", icon: <XCircle className="h-3 w-3 mr-1" />,             label: "Refuzuar" },
  unpublished:        { v: "outline",     icon: <EyeOff className="h-3 w-3 mr-1" />,              label: "Hequr nga GSV" },
  unpublished_remote: { v: "destructive", icon: <AlertTriangle className="h-3 w-3 mr-1" />,       label: "Zhdukur në Google" },
  stale:              { v: "secondary",   icon: <RotateCw className="h-3 w-3 mr-1" />,            label: "Ndryshime të reja — Republish" },
};

function StatusBadge({ status }: { status: GsvStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.not_published;
  return <Badge variant={m.v} className="text-[10px]">{m.icon}{m.label}</Badge>;
}

const ACTIVE_QUEUE = new Set(["pending_review", "approved", "publishing"]);

export function GsvPublishPanel({ tourId }: { tourId: string }) {
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ss } = await supabase
      .from("tour_scenes")
      .select("id,name,panorama_url,street_view_lat,street_view_lng,heading,privacy_approved,local_published,gsv_status,gsv_pano_id,gsv_url,gsv_upload_time,gsv_last_error,gsv_attempt_count,gsv_last_synced_at")
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

  const activeQueueFor = (sceneId: string) =>
    queue.find((q) => q.scene_id === sceneId && ACTIVE_QUEUE.has(q.status));

  const enqueue = async (scene: SceneRow, action: "publish" | "unpublish" | "republish") => {
    if (action !== "unpublish") {
      const blockers: string[] = [];
      if (!scene.panorama_url) blockers.push("panoramë e pastruar");
      if (!scene.privacy_approved) blockers.push("aprovim privatësie");
      if (scene.street_view_lat == null || scene.street_view_lng == null) blockers.push("vendndodhje (lat/lng)");
      if (blockers.length) { toast.error(`Mungon: ${blockers.join(", ")}`); return; }
    }
    setBusy(scene.id);
    const { data: u } = await supabase.auth.getUser();
    const { error: qErr } = await supabase.from("gsv_publish_queue").insert({
      scene_id: scene.id,
      requested_by: u.user?.id,
      status: "pending_review",
      action,
    });
    if (qErr) { setBusy(null); toast.error(qErr.message); return; }
    await supabase.from("tour_scenes").update({ gsv_status: "pending_review" }).eq("id", scene.id);
    setBusy(null);
    toast.success("U dërgua për aprovim nga admini");
    load();
  };

  const cancelQueueItem = async (scene: SceneRow, queueId: string) => {
    setBusy(scene.id);
    await supabase.from("gsv_publish_queue").update({ status: "cancelled" }).eq("id", queueId);
    const fallback: GsvStatus = scene.gsv_pano_id ? "published" : "not_published";
    await supabase.from("tour_scenes").update({ gsv_status: fallback }).eq("id", scene.id);
    setBusy(null);
    toast.success("Kërkesa u anulua");
    load();
  };

  const toggleLocal = async (scene: SceneRow, value: boolean) => {
    setBusy(scene.id);
    const { error } = await supabase.from("tour_scenes").update({ local_published: value }).eq("id", scene.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    setScenes((arr) => arr.map((x) => x.id === scene.id ? { ...x, local_published: value } : x));
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
          const aq = activeQueueFor(s.id);
          const status: GsvStatus = (aq ? (aq.status as GsvStatus) : s.gsv_status) ?? "not_published";
          const hasLoc = s.street_view_lat != null && s.street_view_lng != null;
          return (
            <li key={s.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{s.name}</span>
                    <StatusBadge status={status} />
                    {!s.privacy_approved && <Badge variant="destructive" className="text-[10px]">⚠ pa skanim</Badge>}
                    {!s.local_published && <Badge variant="outline" className="text-[10px]"><EyeOff className="h-3 w-3 mr-1" /> Fshehur lokalisht</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {hasLoc ? `${s.street_view_lat!.toFixed(5)}, ${s.street_view_lng!.toFixed(5)}` : "—"}</span>
                    <span className="flex items-center gap-1"><Compass className="h-3 w-3" /> {Math.round(s.heading)}°</span>
                    {s.gsv_url && <a href={s.gsv_url} target="_blank" rel="noreferrer" className="text-primary underline truncate">Hap në GSV</a>}
                    {s.gsv_pano_id && <span className="font-mono">#{s.gsv_pano_id.slice(0, 12)}…</span>}
                    {s.gsv_upload_time && <span>publikuar {new Date(s.gsv_upload_time).toLocaleDateString()}</span>}
                    {s.gsv_attempt_count > 0 && <span>· {s.gsv_attempt_count} përpjekje</span>}
                  </div>
                  {s.gsv_last_error && (status === "failed" || status === "rejected" || status === "unpublished_remote") && (
                    <div className="text-[11px] text-destructive truncate">⚠ {s.gsv_last_error}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <Switch checked={s.local_published} onCheckedChange={(v) => toggleLocal(s, v)} disabled={busy === s.id} />
                    <span className="text-muted-foreground">{s.local_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</span>
                  </Label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {aq ? (
                  <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => cancelQueueItem(s, aq.id)}>
                    <X className="h-3.5 w-3.5 mr-1" /> Anulo kërkesën ({aq.action})
                  </Button>
                ) : status === "not_published" || status === "unpublished" || status === "unpublished_remote" ? (
                  <Button size="sm" disabled={busy === s.id} onClick={() => enqueue(s, "publish")}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Publish në GSV
                  </Button>
                ) : status === "published" ? (
                  <>
                    <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => enqueue(s, "republish")}>
                      <RotateCw className="h-3.5 w-3.5 mr-1" /> Republish (sinkronizo)
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busy === s.id} onClick={() => enqueue(s, "unpublish")}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Unpublish nga GSV
                    </Button>
                  </>
                ) : status === "stale" ? (
                  <>
                    <Button size="sm" disabled={busy === s.id} onClick={() => enqueue(s, "republish")}>
                      <RotateCw className="h-3.5 w-3.5 mr-1" /> Republish me ndryshimet
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === s.id}
                      onClick={async () => { await supabase.from("tour_scenes").update({ gsv_status: "published" }).eq("id", s.id); load(); }}>
                      Mbaj versionin aktual
                    </Button>
                  </>
                ) : (status === "failed" || status === "rejected") ? (
                  <Button size="sm" disabled={busy === s.id} onClick={() => enqueue(s, "republish")}>
                    <RotateCw className="h-3.5 w-3.5 mr-1" /> Republish
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
        {scenes.length === 0 && <li className="text-sm text-muted-foreground text-center py-4">Asnjë skenë.</li>}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Panorama ruhet gjithmonë në aplikacionin tonë. Publikimi në Google Street View është opsional —
        edhe nëse dështon, refuzohet ose hiqet nga Google, skena mbetet plotësisht e disponueshme këtu.
        Çelësi "syri" fsheh skenën vetëm nga aplikacioni pa fshirë asgjë.
      </p>
    </div>
  );
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}