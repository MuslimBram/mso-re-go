import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAiGuide } from "@/lib/ai-guide.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

export function AiPanel({ context }: { context: string }) {
  const ask = useServerFn(askAiGuide);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "u" | "a"; text: string }[]>([]);
  const submit = async () => {
    const question = q.trim(); if (!question || busy) return;
    setMsgs((m) => [...m, { role: "u", text: question }]); setQ(""); setBusy(true);
    try {
      const r = await ask({ data: { question, context } });
      setMsgs((m) => [...m, { role: "a", text: r.answer }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "a", text: `Gabim: ${e instanceof Error ? e.message : "i panjohur"}` }]);
    } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {msgs.length === 0 && <p className="text-xs text-muted-foreground">Pyet rreth këtij vendi, historisë, kulturës…</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "u" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm whitespace-pre-line ${m.role === "u" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.text}</div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Duke menduar…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-1.5">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pyet AI…" disabled={busy} />
        <Button type="submit" size="icon" disabled={busy || !q.trim()}><Send className="h-3.5 w-3.5" /></Button>
      </form>
    </div>
  );
}