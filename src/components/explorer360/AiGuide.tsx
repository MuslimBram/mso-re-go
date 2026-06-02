import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAiGuide } from "@/lib/ai-guide.functions";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  context?: string;
  className?: string;
}

export function AiGuide({ context, className }: Props) {
  const ask = useServerFn(askAiGuide);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const submit = async () => {
    const question = q.trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setLoading(true);
    try {
      const res = await ask({ data: { question, context } });
      setMessages((m) => [...m, { role: "ai", text: res.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: `Gabim: ${e instanceof Error ? e.message : "i panjohur"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-24 right-6 z-30 h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform ${className ?? ""}`}
        aria-label="AI Guide"
        title="AI Guide"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-background text-foreground shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4 text-amber-500" /> AI Guide
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Pyet çdo gjë rreth vendit, historisë ose kulturës.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Duke menduar…
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="p-3 border-t flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pyet AI Guide…" disabled={loading} />
              <Button type="submit" size="icon" disabled={loading || !q.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}