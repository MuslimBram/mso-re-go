import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Check, X, RotateCw, ExternalLink } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin/gsv-queue")({ component: AdminGsvQueue });

const TABS = [
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "publishing", label: "Publishing" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
  { key: "unpublished", label: "Unpublished" },
] as const;

interface Row {
  id: string;
  scene_id: string;
  status: string;
  action: string;
  attempt_count: number;
  last_error: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  requested_by: string | null;
  scene?: {
    name: string;
    panorama_url: string | null;
    gsv_url: string | null;
    gsv_pano_id: string | null;
    tour_id: string;
    tours?: { title: string; slug: string } | null;
  } | null;
}

function AdminGsvQueue() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<string>("pending_review");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!r);
    })();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gsv_publish_queue")
      .select("*, scene:tour_scenes(name,panorama_url,gsv_url,gsv_pano_id,tour_id,tours(title,slug))")
      .eq("status", tab)
      .order("updated_at", { ascending: false })
      .limit(200);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [tab, isAdmin]);

  const approve = async (row: Row) => {
    setBusy(row.id);
    await supabase.from("gsv_publish_queue").update({ status: "approved" }).eq("id", row.id);
    await supabase.from("tour_scenes").update({ gsv_status: "approved" }).eq("id", row.scene_id);
    setBusy(null);
    toast.success("U aprovua — worker-i do ta marrë në duar");
    load();
  };
  const rerun = async (row: Row) => {
    setBusy(row.id);
    await supabase.from("gsv_publish_queue").update({ status: "approved", last_error: null }).eq("id", row.id);
    await supabase.from("tour_scenes").update({ gsv_status: "approved", gsv_last_error: null }).eq("id", row.scene_id);
    setBusy(null);
    toast.success("U vendos sërish në radhë");
    load();
  };
  const submitReject = async () => {
    if (!rejectFor) return;
    const row = rows.find((r) => r.id === rejectFor);
    if (!row) return;
    setBusy(row.id);
    await supabase.from("gsv_publish_queue").update({ status: "rejected", last_error: rejectReason || "Refuzuar nga admini" }).eq("id", row.id);
    await supabase.from("tour_scenes").update({ gsv_status: "rejected", gsv_last_error: rejectReason || "Refuzuar nga admini" }).eq("id", row.scene_id);
    setBusy(null); setRejectFor(null); setRejectReason("");
    toast.success("U refuzua");
    load();
  };

  if (isAdmin === null) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  if (!isAdmin) return (
    <div className="p-8 text-center space-y-3">
      <p className="text-sm">Vetëm administratorët mund të hyjnë këtu.</p>
      <Link to="/" className="text-primary underline text-sm">Kthehu</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/explorer-360/admin"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Admin</Button></Link>
          <h1 className="font-semibold">Street View — radha e publikimit</h1>
          <div className="ml-auto"><Button size="sm" variant="outline" onClick={load}>Rifresko</Button></div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            {TABS.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4">
              {loading ? <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
                <ul className="space-y-2">
                  {rows.map((r) => (
                    <li key={r.id} className="rounded-lg border p-3 flex items-start gap-3">
                      {r.scene?.panorama_url && (
                        <img src={r.scene.panorama_url} alt="" className="w-24 h-16 object-cover rounded border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{r.scene?.name ?? "—"}</span>
                          <Badge variant="outline" className="text-[10px]">{r.action}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{r.attempt_count} përpjekje</Badge>
                          {r.scene?.tours && (
                            <Link to="/explorer-360/tour/$slug" params={{ slug: r.scene.tours.slug }} className="text-[11px] text-primary underline">
                              {r.scene.tours.title}
                            </Link>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(r.updated_at).toLocaleString()}
                          {r.scene?.gsv_url && (
                            <a href={r.scene.gsv_url} target="_blank" rel="noreferrer" className="ml-2 text-primary inline-flex items-center gap-0.5">
                              GSV <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {(r.last_error || r.error) && <div className="text-[11px] text-destructive mt-1">⚠ {r.last_error || r.error}</div>}
                        {rejectFor === r.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Arsyeja e refuzimit…" className="text-xs h-16" />
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={submitReject} disabled={busy === r.id}>Konfirmo refuzimin</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRejectFor(null); setRejectReason(""); }}>Anulo</Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {r.status === "pending_review" && (
                          <>
                            <Button size="sm" disabled={busy === r.id} onClick={() => approve(r)}><Check className="h-3.5 w-3.5 mr-1" /> Aprovo</Button>
                            <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => { setRejectFor(r.id); setRejectReason(""); }}><X className="h-3.5 w-3.5 mr-1" /> Refuzo</Button>
                          </>
                        )}
                        {(r.status === "failed" || r.status === "rejected") && (
                          <Button size="sm" disabled={busy === r.id} onClick={() => rerun(r)}><RotateCw className="h-3.5 w-3.5 mr-1" /> Re-run</Button>
                        )}
                      </div>
                    </li>
                  ))}
                  {rows.length === 0 && <li className="text-sm text-muted-foreground text-center py-8">Asnjë rresht në "{t.label}".</li>}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}