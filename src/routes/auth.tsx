import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Fish, Lock, Mail } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard" }),
  head: () => ({ meta: [{ title: "Sign in | Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect || "/dashboard" });
  }, [user, loading, navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      toast.error("Please enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created! You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message || "Google sign-in failed");
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-wave-gradient">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-elev">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-hero-gradient text-primary-foreground shadow-elev">
              <Fish className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">{t("auth.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk.</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.19 3.32v2.77h3.54c2.07-1.91 3.29-4.73 3.29-8.1z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.54-2.77c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.18v2.86A11 11 0 0 0 12 23z"/><path fill="#fbbc05" d="M5.83 14.08a6.6 6.6 0 0 1 0-4.16V7.06H2.18a11 11 0 0 0 0 9.88z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.65 2.86C6.7 7.32 9.13 5.38 12 5.38z"/></svg>
            {t("auth.google")}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("auth.or")} <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium">{t("auth.name")}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
            )}
            <div>
              <label className="text-xs font-medium">{t("auth.email")}</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{t("auth.password")}</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required minLength={6} />
              </div>
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-elev hover:bg-primary/90 disabled:opacity-50">
              {mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? t("auth.switchSignup") : t("auth.switchSignin")}
          </button>
        </div>
        <Link to="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
      </div>
    </div>
  );
}
