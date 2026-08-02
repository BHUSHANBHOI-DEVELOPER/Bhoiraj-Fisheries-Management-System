import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { signInWithIdentifier, startRoleLogin, completeRoleLogin, resendRoleOtp } from "@/lib/auth.functions";
import { setActiveProfile } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Fish, Lock, Mail, ShieldCheck, Users, ArrowLeft, Eye, EyeOff, KeyRound, Wrench, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
    profile:
      s.profile === "chairman" || s.profile === "member" || s.profile === "admin"
        ? (s.profile as "chairman" | "member" | "admin")
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Select Login Profile | Bhoiraj Matsya Sanstha" },
      {
        name: "description",
        content:
          "Chairman, Admin and Member login for Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. Chairman and Admin access is protected by a one-time code.",
      },
      { property: "og:title", content: "Select Login Profile | Bhoiraj Matsya Sanstha" },
      { property: "og:description", content: "Secure portal login for the Chairman, Admins and registered members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Profile = "chairman" | "admin" | "member";

const PROFILE_META: Record<Profile, { title: string; icon: typeof ShieldCheck; tone: "saffron" | "primary" | "teal" }> = {
  chairman: { title: "Chairman Login", icon: ShieldCheck, tone: "saffron" },
  admin: { title: "Admin / Developer Login", icon: Wrench, tone: "teal" },
  member: { title: "Member Login", icon: Users, tone: "primary" },
};

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { redirect, profile: initialProfile } = useSearch({ from: "/auth" });

  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // OTP stage (Chairman / Admin only)
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startLogin = useServerFn(startRoleLogin);
  const completeLogin = useServerFn(completeRoleLogin);
  const resendOtp = useServerFn(resendRoleOtp);
  const signIn = useServerFn(signInWithIdentifier);

  const needsOtp = profile === "chairman" || profile === "admin";

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (loading || !user) return;
    if (needsOtp) {
      navigate({ to: isAdmin ? "/admin" : "/dashboard" });
      return;
    }
    navigate({ to: redirect || "/dashboard" });
  }, [user, loading, isAdmin, needsOtp, navigate, redirect]);

  function resetToPassword() {
    setOtpEmail(null);
    setCode("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (identifier.trim().length < 3) return toast.error("Enter your mobile number, Aadhaar number or email.");
    if (password.length < 1) return toast.error("Enter your password.");
    setBusy(true);
    try {
      if (needsOtp) {
        const res = await startLogin({ data: { identifier: identifier.trim(), password, profile: profile! } });
        setOtpEmail(res.email);
        setMaskedEmail(res.maskedEmail);
        setCooldown(45);
        if (res.smsSent) {
          toast.success(`Password verified. A 6-digit code was sent by SMS to ${res.maskedPhone}.`);
        } else {
          toast.warning(`Password verified, but the code could not be texted (${res.smsReason}). Ask the Admin for the code.`);
        }
      } else {
        setActiveProfile("member");
        const tokens = await signIn({ data: { identifier: identifier.trim(), password } });
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!otpEmail) return;
    if (!/^\d{6}$/.test(code.trim())) return toast.error("Enter the 6-digit code sent to your mobile.");
    setBusy(true);
    try {
      const tokens = await completeLogin({
        data: { identifier: identifier.trim(), password, profile: profile!, code: code.trim() },
      });
      setActiveProfile(profile!);
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (error) throw error;
      toast.success(profile === "chairman" ? "Chairman access granted." : "Admin access granted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify the code");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!otpEmail || cooldown > 0) return;
    setBusy(true);
    try {
      const res = await resendOtp({ data: { email: otpEmail, profile: profile! } });
      setCooldown(45);
      if (res.smsSent) toast.success("A new code has been texted to you.");
      else toast.warning(`Code regenerated, but SMS failed (${res.smsReason}).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the code");
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

  const meta = profile ? PROFILE_META[profile] : null;
  const Icon = meta?.icon ?? Users;

  return (
    <div className="min-h-screen bg-wave-gradient">
      <SiteHeader />
      <div className="mx-auto flex max-w-4xl flex-col px-4 py-12">
        {!profile ? (
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-elev backdrop-blur">
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-hero-gradient text-primary-foreground shadow-elev">
                <Fish className="h-6 w-6" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">Select your Login Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <ProfileCard
                onClick={() => setProfile("chairman")}
                icon={<ShieldCheck className="h-7 w-7" />}
                title="Chairman Login"
                desc="Full control — members, documents, dam audits, photos and notices. Protected by a one-time code."
                tone="saffron"
              />
              <ProfileCard
                onClick={() => setProfile("admin")}
                icon={<Wrench className="h-7 w-7" />}
                title="Admin / Developer"
                desc="Technical and support access granted by the Chairman. Protected by a one-time code."
                tone="teal"
              />
              <ProfileCard
                onClick={() => setProfile("member")}
                icon={<Users className="h-7 w-7" />}
                title="Member Login"
                desc="View society documents, dam audits, notices and your own membership record."
                tone="primary"
              />
            </div>
            <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-center text-sm">
              <div>
                Registration is required before login — for Chairman, Admin and Members alike.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  to="/register"
                  className="rounded-md bg-saffron px-4 py-2 text-xs font-bold text-saffron-foreground hover:brightness-95"
                >
                  Register (Member)
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Register (Chairman)
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-teal px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-95"
                >
                  Register (Admin)
                </Link>
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="mx-auto flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 sm:w-auto"
              >
                <Mail className="h-4 w-4" /> Continue with Google
              </button>
            </div>

            <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card/85 p-8 shadow-elev backdrop-blur">
            <button
              onClick={() => {
                resetToPassword();
                setProfile(null);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change login profile
            </button>

            <div className="mb-6 flex flex-col items-center text-center">
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl text-primary-foreground shadow-elev ${
                  meta?.tone === "saffron" ? "bg-saffron" : meta?.tone === "teal" ? "bg-teal" : "bg-hero-gradient"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">{meta?.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {otpEmail
                  ? `Step 2 of 2 — verify the email we just sent to ${maskedEmail}`
                  : needsOtp
                    ? "Step 1 of 2 — password, then a one-time code by email"
                    : t("auth.title")}
              </p>
            </div>

            {otpEmail ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="text-xs font-medium">6-digit one-time code</label>
                  <div className="relative mt-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="123456"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-center text-lg font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-md bg-saffron py-2.5 text-sm font-semibold text-saffron-foreground shadow-elev hover:brightness-95 disabled:opacity-50"
                >
                  Verify code &amp; sign in
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={busy || cooldown > 0}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                  <button type="button" onClick={resetToPassword} className="text-muted-foreground hover:text-foreground">
                    Start again
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Access is granted only after this email is verified. Open the email and either tap the secure sign-in
                  link or type the 6-digit code if your email shows one. Every attempt is

                  recorded in the activity log.
                </p>
              </form>
            ) : (
              <>
                {profile === "member" && (
                  <>
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
                  </>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium" htmlFor="login-identifier">
                      Mobile number, Aadhaar number or email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="login-identifier"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="9876543210 / 123412341234 / you@example.com"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" htmlFor="login-password">
                      {t("auth.password")}
                    </label>
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className={`w-full rounded-md py-2.5 text-sm font-semibold shadow-elev disabled:opacity-50 ${
                      needsOtp
                        ? "bg-saffron text-saffron-foreground hover:brightness-95"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {needsOtp ? "Continue — send one-time code" : t("auth.signin")}
                  </button>
                </form>

                {needsOtp && (
                  <p className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    {profile === "chairman" ? "Chairman" : "Admin"} rights open only through this door, and only after the
                    emailed one-time code is matched.
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs">
                  <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                    Forgot Login ID / Password?
                  </Link>
                  {profile === "member" && (
                    <Link to="/register" className="text-muted-foreground hover:text-foreground">
                      New member? Register →
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({
  onClick, icon, title, desc, tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "saffron" | "primary" | "teal";
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border bg-background/70 p-6 text-left transition hover:-translate-y-1 hover:shadow-elev"
    >
      <div
        className={`grid h-14 w-14 place-items-center rounded-xl ${
          tone === "saffron"
            ? "bg-saffron/15 text-saffron"
            : tone === "teal"
              ? "bg-teal/15 text-teal"
              : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="mt-4 font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}
