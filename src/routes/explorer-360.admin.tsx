import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Save, Settings, Box, Globe2, MapPin } from "lucide-react";
import { toast, Toaster } from "sonner";

async function uploadPanorama(file: File): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) { toast.error("Duhet të jesh i kyçur"); return null; }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("tour-panoramas").upload(path, file, {
    cacheControl: "31536000", upsert: false, contentType: file.type || "image/jpeg",
  });
  if (upErr) { toast.error(upErr.message); return null; }
  // Long-lived signed URL (10 years) since bucket is private.
  const { data: signed, error: sErr } = await supabase.storage.from("tour-panoramas").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (sErr || !signed?.signedUrl) { toast.error(sErr?.message ?? "Sign URL failed"); return null; }
  return signed.signedUrl;
}

function PanoramaField({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Panorama (equirectangular .jpg)</Label>
      <div className="flex gap-2">
        <Input
          defaultValue={value ?? ""}
          key={value ?? ""}
          placeholder="https://… ose ngarko skedar"
          onBlur={(e) => { const v = e.target.value || null; if (v !== value) onChange(v); }}
          className="flex-1"
        />
        <label className={`inline-flex items-center gap-1 px-3 rounded-md border cursor-pointer text-xs whitespace-nowrap ${busy ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}>
          {busy ? "Po ngarkohet…" : "Ngarko"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              const url = await uploadPanorama(f);
              setBusy(false);
              e.target.value = "";
              if (url) { onChange(url); toast.success("Panorama u ngarkua"); }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/explorer-360/admin")({
  component: AdminPage,
});

interface Tour {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  lat: number | null;
  lng: number | null;
  featured: boolean;
  published: boolean;
}
interface Scene {
  id: string;
  tour_id: string;
  name: string;
  panorama_url: string | null;
  source: string;
  initial_yaw: number;
  initial_pitch: number;
  initial_fov: number;
  order_index: number;
}
interface Hotspot {
  id: string;
  scene_id: string;
  type: string;
  yaw: number;
  pitch: number;
  title: string | null;
  body: string | null;
  media_url: string | null;
  link_url: string | null;
  target_scene_id: string | null;
}
interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  sketchfab_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  published: boolean;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u);
      if (!u) { setIsAdmin(false); return; }
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleRow);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Duke verifikuar…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Settings className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Duhet të kyçesh</h1>
        <p className="text-sm text-muted-foreground max-w-md">Krijo një llogari falas për të shtuar tour-et e tua 360° dhe për të ruajtur favoritet & historikun.</p>
        <Link to="/auth"><Button>Kyçu / Regjistrohu</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/explorer-360" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> 360° Explorer
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <Settings className="h-5 w-5 text-primary" /> {isAdmin ? "Admin" : "Tour-et e mia"}
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="tours">
          <TabsList>
            <TabsTrigger value="tours"><Globe2 className="h-4 w-4 mr-1.5" /> Tour-e 360°</TabsTrigger>
            {isAdmin && <TabsTrigger value="showcase"><Box className="h-4 w-4 mr-1.5" /> Showcase 3D</TabsTrigger>}
          </TabsList>
          <TabsContent value="tours" className="mt-4"><ToursAdmin /></TabsContent>
          {isAdmin && <TabsContent value="showcase" className="mt-4"><ShowcaseAdmin /></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
}

function ToursAdmin() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selected, setSelected] = useState<Tour | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  const reload = async () => {
    const { data } = await supabase.from("tours").select("*").order("created_at", { ascending: false });
    setTours((data ?? []) as Tour[]);
  };
  useEffect(() => { reload(); }, []);

  const loadScenes = async (tourId: string) => {
    const { data: ss } = await supabase.from("tour_scenes").select("*").eq("tour_id", tourId).order("order_index");
    setScenes((ss ?? []) as Scene[]);
    const ids = (ss ?? []).map((s) => s.id);
    if (ids.length) {
      const { data: hs } = await supabase.from("tour_hotspots").select("*").in("scene_id", ids);
      setHotspots((hs ?? []) as Hotspot[]);
    } else setHotspots([]);
  };

  const selectTour = async (t: Tour) => {
    setSelected(t);
    await loadScenes(t.id);
  };

  const createTour = async () => {
    const title = window.prompt("Titulli i tour-it:");
    if (!title) return;
    const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("tours")
      .insert({ title, slug, published: false })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Tour-i u krijua");
    await reload();
    selectTour(data as Tour);
  };

  const updateTour = async (patch: Partial<Tour>) => {
    if (!selected) return;
    const { data, error } = await supabase.from("tours").update(patch).eq("id", selected.id).select().single();
    if (error) { toast.error(error.message); return; }
    setSelected(data as Tour);
    await reload();
    toast.success("U ruajt");
  };

  const deleteTour = async (id: string) => {
    if (!confirm("Fshi tour-in?")) return;
    // delete hotspots, scenes, tour
    const { data: ss } = await supabase.from("tour_scenes").select("id").eq("tour_id", id);
    const sceneIds = (ss ?? []).map((s) => s.id);
    if (sceneIds.length) await supabase.from("tour_hotspots").delete().in("scene_id", sceneIds);
    await supabase.from("tour_scenes").delete().eq("tour_id", id);
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selected?.id === id) { setSelected(null); setScenes([]); setHotspots([]); }
    reload();
    toast.success("U fshi");
  };

  const addScene = async () => {
    if (!selected) return;
    const name = window.prompt("Emri i skenës:");
    if (!name) return;
    const order_index = scenes.length;
    const { error } = await supabase.from("tour_scenes").insert({
      tour_id: selected.id, name, order_index, source: "upload",
    });
    if (error) { toast.error(error.message); return; }
    loadScenes(selected.id);
  };

  const updateScene = async (id: string, patch: Partial<Scene>) => {
    const { error } = await supabase.from("tour_scenes").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("U ruajt"); if (selected) loadScenes(selected.id); }
  };
  const deleteScene = async (id: string) => {
    if (!confirm("Fshi skenën?")) return;
    await supabase.from("tour_hotspots").delete().eq("scene_id", id);
    await supabase.from("tour_scenes").delete().eq("id", id);
    if (selected) loadScenes(selected.id);
  };

  const addHotspot = async (sceneId: string) => {
    const { error } = await supabase.from("tour_hotspots").insert({
      scene_id: sceneId, type: "info", yaw: 0, pitch: 0, title: "Hotspot i ri",
    });
    if (error) toast.error(error.message);
    else if (selected) loadScenes(selected.id);
  };
  const updateHotspot = async (id: string, patch: Partial<Hotspot>) => {
    const { error } = await supabase.from("tour_hotspots").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else if (selected) loadScenes(selected.id);
  };
  const deleteHotspot = async (id: string) => {
    await supabase.from("tour_hotspots").delete().eq("id", id);
    if (selected) loadScenes(selected.id);
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <aside className="rounded-xl border bg-card p-3 space-y-2 max-h-[75vh] overflow-y-auto">
        <Button size="sm" className="w-full" onClick={createTour}><Plus className="h-4 w-4 mr-1" /> Tour i ri</Button>
        {tours.map((t) => (
          <div key={t.id} className={`group flex items-center justify-between rounded-lg p-2 cursor-pointer ${selected?.id === t.id ? "bg-primary/10" : "hover:bg-muted"}`} onClick={() => selectTour(t)}>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate flex items-center gap-1">
                {t.title} {t.published && <span className="text-[9px] text-green-600">●</span>}
              </div>
              <div className="text-xs text-muted-foreground truncate">/{t.slug}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteTour(t.id); }} className="opacity-0 group-hover:opacity-100 text-destructive p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </aside>

      <div className="rounded-xl border bg-card p-4">
        {!selected ? (
          <div className="text-center py-16 text-muted-foreground">Zgjidh ose krijo një tour.</div>
        ) : (
          <div className="space-y-6">
            <section className="grid sm:grid-cols-2 gap-3">
              <div><Label>Titull</Label><Input defaultValue={selected.title} onBlur={(e) => e.target.value !== selected.title && updateTour({ title: e.target.value })} /></div>
              <div><Label>Slug</Label><Input defaultValue={selected.slug} onBlur={(e) => e.target.value !== selected.slug && updateTour({ slug: slugify(e.target.value) })} /></div>
              <div className="sm:col-span-2"><Label>Përshkrim</Label><Textarea defaultValue={selected.description ?? ""} onBlur={(e) => updateTour({ description: e.target.value || null })} /></div>
              <div><Label>Kategori</Label><Input defaultValue={selected.category ?? ""} onBlur={(e) => updateTour({ category: e.target.value || null })} /></div>
              <div><Label>Cover URL</Label><Input defaultValue={selected.cover_url ?? ""} placeholder="https://…" onBlur={(e) => updateTour({ cover_url: e.target.value || null })} /></div>
              <div><Label><MapPin className="h-3 w-3 inline" /> Lat</Label><Input type="number" step="any" defaultValue={selected.lat ?? ""} onBlur={(e) => updateTour({ lat: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Lng</Label><Input type="number" step="any" defaultValue={selected.lng ?? ""} onBlur={(e) => updateTour({ lng: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="flex items-center gap-2"><Switch checked={selected.featured} onCheckedChange={(v) => updateTour({ featured: v })} /><Label>Featured</Label></div>
              <div className="flex items-center gap-2"><Switch checked={selected.published} onCheckedChange={(v) => updateTour({ published: v })} /><Label>Publikuar</Label></div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Skenat ({scenes.length})</h3>
                <Button size="sm" variant="outline" onClick={addScene}><Plus className="h-4 w-4 mr-1" /> Skenë</Button>
              </div>
              <div className="space-y-3">
                {scenes.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && updateScene(s.id, { name: e.target.value })} className="font-medium" />
                      <Button size="icon" variant="ghost" onClick={() => deleteScene(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div><Label className="text-xs">Panorama URL (equirectangular .jpg)</Label><Input defaultValue={s.panorama_url ?? ""} placeholder="https://…" onBlur={(e) => updateScene(s.id, { panorama_url: e.target.value || null })} /></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label className="text-xs">Yaw fillestar</Label><Input type="number" step="0.01" defaultValue={s.initial_yaw} onBlur={(e) => updateScene(s.id, { initial_yaw: Number(e.target.value) || 0 })} /></div>
                      <div><Label className="text-xs">Pitch</Label><Input type="number" step="0.01" defaultValue={s.initial_pitch} onBlur={(e) => updateScene(s.id, { initial_pitch: Number(e.target.value) || 0 })} /></div>
                      <div><Label className="text-xs">FOV</Label><Input type="number" step="1" defaultValue={s.initial_fov} onBlur={(e) => updateScene(s.id, { initial_fov: Number(e.target.value) || 90 })} /></div>
                    </div>

                    <div className="pl-3 border-l-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Hotspots</span>
                        <Button size="sm" variant="ghost" onClick={() => addHotspot(s.id)}><Plus className="h-3 w-3 mr-1" /> Hotspot</Button>
                      </div>
                      {hotspots.filter((h) => h.scene_id === s.id).map((h) => (
                        <div key={h.id} className="rounded border p-2 space-y-1 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <select value={h.type} onChange={(e) => updateHotspot(h.id, { type: e.target.value })} className="text-xs border rounded px-1 py-0.5 bg-background">
                              <option value="info">info</option>
                              <option value="image">image</option>
                              <option value="audio">audio</option>
                              <option value="video">video</option>
                              <option value="scene">scene (lidh skenë)</option>
                            </select>
                            <Input defaultValue={h.title ?? ""} placeholder="Titulli" onBlur={(e) => updateHotspot(h.id, { title: e.target.value || null })} className="h-7 text-xs" />
                            <button onClick={() => deleteHotspot(h.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <Input type="number" step="0.01" defaultValue={h.yaw} placeholder="yaw" onBlur={(e) => updateHotspot(h.id, { yaw: Number(e.target.value) || 0 })} className="h-7 text-xs" />
                            <Input type="number" step="0.01" defaultValue={h.pitch} placeholder="pitch" onBlur={(e) => updateHotspot(h.id, { pitch: Number(e.target.value) || 0 })} className="h-7 text-xs" />
                          </div>
                          {h.type === "scene" ? (
                            <select value={h.target_scene_id ?? ""} onChange={(e) => updateHotspot(h.id, { target_scene_id: e.target.value || null })} className="text-xs border rounded px-1 py-0.5 bg-background w-full">
                              <option value="">— zgjidh skenë —</option>
                              {scenes.filter((x) => x.id !== s.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                            </select>
                          ) : (
                            <Input defaultValue={h.media_url ?? ""} placeholder="Media URL (foto/audio/video)" onBlur={(e) => updateHotspot(h.id, { media_url: e.target.value || null })} className="h-7 text-xs" />
                          )}
                          <Textarea defaultValue={h.body ?? ""} placeholder="Përshkrim" onBlur={(e) => updateHotspot(h.id, { body: e.target.value || null })} className="text-xs min-h-[40px]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {scenes.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">Asnjë skenë ende.</div>}
              </div>
            </section>

            <div className="text-xs text-muted-foreground flex items-center gap-1"><Save className="h-3 w-3" /> Ndryshimet ruhen automatikisht kur dilni nga fusha.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShowcaseAdmin() {
  const [items, setItems] = useState<Product[]>([]);

  const reload = async () => {
    const { data } = await supabase.from("showcase_products").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
  };
  useEffect(() => { reload(); }, []);

  const create = async () => {
    const title = window.prompt("Titulli i produktit/modelit:");
    if (!title) return;
    const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("showcase_products").insert({ title, slug, published: false });
    if (error) toast.error(error.message); else { toast.success("U krijua"); reload(); }
  };
  const update = async (id: string, patch: Partial<Product>) => {
    const { error } = await supabase.from("showcase_products").update(patch).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };
  const remove = async (id: string) => {
    if (!confirm("Fshi modelin?")) return;
    await supabase.from("showcase_products").delete().eq("id", id);
    reload();
  };

  return (
    <div className="space-y-4">
      <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> Model i ri</Button>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Input defaultValue={p.title} onBlur={(e) => e.target.value !== p.title && update(p.id, { title: e.target.value })} className="font-semibold" />
              <button onClick={() => remove(p.id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
            <Textarea defaultValue={p.description ?? ""} placeholder="Përshkrim" onBlur={(e) => update(p.id, { description: e.target.value || null })} />
            <div className="grid grid-cols-2 gap-2">
              <Input defaultValue={p.category ?? ""} placeholder="Kategori" onBlur={(e) => update(p.id, { category: e.target.value || null })} />
              <Input defaultValue={p.thumbnail_url ?? ""} placeholder="Thumbnail URL" onBlur={(e) => update(p.id, { thumbnail_url: e.target.value || null })} />
            </div>
            <Input defaultValue={p.sketchfab_url ?? ""} placeholder="Sketchfab URL (model ose embed)" onBlur={(e) => update(p.id, { sketchfab_url: e.target.value || null })} />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><Switch checked={p.featured} onCheckedChange={(v) => update(p.id, { featured: v })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={p.published} onCheckedChange={(v) => update(p.id, { published: v })} /> Publikuar</label>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-muted-foreground text-center py-8 col-span-2">Asnjë model ende.</div>}
      </div>
    </div>
  );
}