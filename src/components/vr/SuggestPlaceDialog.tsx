import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";
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
});

export function SuggestPlaceDialog({ open, onClose, currentLat, currentLng }: Props) {
  const [name, setName] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, place_query: placeQuery, comment, contact });
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