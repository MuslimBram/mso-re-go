import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, ImagePlus, Loader2, X, Link as LinkIcon } from "lucide-react";
import { z } from "zod";

interface Props {
  open: boolean;
  onClose: () => void;
  currentLat?: number;
  currentLng?: number;
}

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  place_query: z.string().trim().min(1, "Vendi është i detyrueshëm").max(500),
  comment: z.string().trim().max(2000).optional(),
  contact: z.string().trim().max(200).optional(),
  link_url: z
    .string()
    .trim()
    .max(500)
    .url("Linku duhet të jetë URL e vlefshme (psh https://...)")
    .optional()
    .or(z.literal("")),
});

export function SuggestPlaceDialog({ open, onClose, currentLat, currentLng }: Props) {
  const [name, setName] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vetëm imazhe lejohen");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imazhi është më i madh se 8MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("suggestion-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setUploading(false);
      toast.error("Ngarkimi dështoi: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("suggestion-photos").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Imazhi u ngarkua");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      name,
      place_query: placeQuery,
      comment,
      contact,
      link_url: linkUrl,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("place_suggestions").insert({
      name: parsed.data.name || null,
      place_query: parsed.data.place_query,
      comment: parsed.data.comment || null,
      contact: parsed.data.contact || null,
      link_url: parsed.data.link_url || null,
      image_url: imageUrl,
      lat: currentLat ?? null,
      lng: currentLng ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Gabim: " + error.message);
      return;
    }
    toast.success("Faleminderit! Sugjerimi u dërgua.");
    setName(""); setPlaceQuery(""); setComment(""); setContact("");
    setLinkUrl(""); setImageUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sugjero një vend</DialogTitle>
          <DialogDescription>
            Lër emrin e vendit që dëshiron të shtohet dhe një koment. Të dhënat janë opsionale.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="sp-place">Vendi *</Label>
            <Input id="sp-place" value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} placeholder="P.sh. Xhamia e Et'hem Beut, Tiranë" required maxLength={500} />
          </div>
          <div>
            <Label htmlFor="sp-comment">Koment</Label>
            <Textarea id="sp-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Pse duhet shtuar?" maxLength={2000} rows={3} />
          </div>
          <div>
            <Label htmlFor="sp-link" className="flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> Link (opsional)
            </Label>
            <Input
              id="sp-link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              maxLength={500}
            />
          </div>
          <div>
            <Label>Foto (opsionale)</Label>
            {imageUrl ? (
              <div className="relative inline-block mt-1">
                <img src={imageUrl} alt="Përshkrim i vendit të sugjeruar" className="h-24 rounded-md border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  aria-label="Hiq imazhin"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex items-center justify-center gap-2 h-20 rounded-md border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...</>
                ) : (
                  <><ImagePlus className="h-4 w-4" /> <span className="text-sm">Kliko për të zgjedhur foto</span></>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-name">Emri yt</Label>
              <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="sp-contact">Kontakt</Label>
              <Input id="sp-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email / tel" maxLength={200} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Duke dërguar..." : "Dërgo sugjerimin"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}