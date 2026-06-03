import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Globe2, ArrowLeft, Mail, Lock } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Kyçu — VR Explorer" },
      { name: "description", content: "Kyçu për të ruajtur favorites dhe historikun e eksplorimit." },
      { property: "og:title", content: "Kyçu — VR Explorer" },
      { property: "og:description", content: "Krijo llogari ose kyçu për të ruajtur favorites dhe historik." },
      { property: "og:url", content: "https://rrogozhina-guide.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://rrogozhina-guide.com/auth" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Llogaria u krijua! Mund të kyçesh tani.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Mirë se u rikthye!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) { toast.error("Shkruaj email-in më parë."); return; }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Të dërguam një email për të rivendosur fjalëkalimin.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-y-auto">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.4 0.15 240 / 0.6), transparent 60%), radial-gradient(ellipse at bottom right, oklch(0.5 0.18 200 / 0.4), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md mx-4 my-8 p-8 rounded-2xl glass-panel hud-glow">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Mbrapa te eksploruesi
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
            <Globe2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{mode === "signin" ? "Kyçu" : "Krijo llogari"}</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Vazhdo eksplorimin tënd" : "Ruaj favorites & historik"}
            </p>
          </div>
        </div>

        {mode === "signup" && (
          <p className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Pas regjistrimit, konfirmo email-in përpara se të kyçesh.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Fjalëkalim</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Duke pritur..." : mode === "signin" ? "Kyçu" : "Krijo llogari"}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={handleForgot}
            disabled={resetting}
            className="mt-3 w-full text-sm text-primary hover:underline disabled:opacity-50"
          >
            {resetting ? "Po dërgohet…" : "Harrova fjalëkalimin"}
          </button>
        )}

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "signin" ? "Nuk ke llogari? Regjistrohu" : "Ke llogari? Kyçu"}
        </button>
      </div>
      <Toaster theme="dark" />
    </div>
  );
}