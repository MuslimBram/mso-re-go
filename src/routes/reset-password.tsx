import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowLeft, Globe2 } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Rivendos fjalëkalimin — VR Explorer" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash and emits
    // a PASSWORD_RECOVERY event. We just wait for any session to be ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Të paktën 6 karaktere."); return; }
    if (password !== confirm) { toast.error("Fjalëkalimet nuk përputhen."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Fjalëkalimi u përditësua.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel hud-glow">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Mbrapa te kyçja
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
            <Globe2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Rivendos fjalëkalimin</h1>
            <p className="text-sm text-muted-foreground">Krijo një fjalëkalim të ri</p>
          </div>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Hap këtë faqe nga linku që morët në email për të vazhduar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Fjalëkalim i ri</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Konfirmo fjalëkalimin</Label>
              <Input id="pw2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Duke ruajtur..." : "Ruaj fjalëkalimin"}
            </Button>
          </form>
        )}
      </div>
      <Toaster theme="dark" />
    </div>
  );
}