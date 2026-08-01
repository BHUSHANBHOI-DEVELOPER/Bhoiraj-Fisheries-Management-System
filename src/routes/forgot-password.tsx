import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { recoverLoginId, setNewPasswordDirect } from "@/lib/auth.functions";
import { generatePassword, ratePassword } from "@/lib/password";
import { toast } from "sonner";
import { KeyRound, IdCard, ArrowLeft, Eye, EyeOff, Wand2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password or Login ID | Bhoiraj Matsya Sanstha" },
      {
        name: "description",
        content:
          "Set a new portal password instantly using your registered mobile number, Aadhaar number or email — no email link needed.",
      },
      { property: "og:title", content: "Forgot Password or Login ID" },
      { property: "og:description", content: "Account recovery for the Chairman, Admins and members of the fisheries cooperative society." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const recover = useServerFn(recoverLoginId);
  const setNew = useServerFn(setNewPasswordDirect);
  const strength = ratePassword(password);

  async function handleFindId() {
    if (identifier.trim().length < 3) return toast.error("Enter your mobile, Aadhaar number or email.");
    setBusy(true);
    try {
      const res = await recover({ data: { identifier } });
      if (!res.found) {
        setMaskedEmail(null);
        toast.error("No account found for that mobile number / Aadhaar number / email.");
      } else {
        setMaskedEmail(res.maskedEmail);
        toast.success("Account found — your login ID is shown below.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not look that up");
    } finally {
      setBusy(false);
    }
  }

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    if (identifier.trim().length < 3) return toast.error("Enter your mobile, Aadhaar number or email.");
    if (secret.replace(/\D/g, "").length < 4) return toast.error("Enter your registered mobile number or the last 4 digits of your Aadhaar.");
    if (password.length <= 8) return toast.error("The new password must be more than 8 characters.");
    if (password !== confirm) return toast.error("The two passwords do not match.");
    setBusy(true);
    try {
      const res = await setNew({ data: { identifier: identifier.trim(), secret, newPassword: password } });
      setMaskedEmail(res.maskedEmail);
      setDone(true);
      toast.success("Your new password is active. You can sign in with it right now.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card/85 p-6 shadow-elev backdrop-blur">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold">Forgot Login ID or Password</h1>
              <p className="text-xs text-muted-foreground">
                Works for the Chairman, Admins and members. Every recovery attempt is recorded.
              </p>
            </div>
          </div>

          {done ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-teal/40 bg-teal/10 p-4 text-sm">
                Your password has been changed for <span className="font-semibold">{maskedEmail}</span>. The old password
                no longer works.
              </div>
              <Link
                to="/auth"
                search={{ profile: undefined, redirect: "/dashboard" }}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSet} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium">Registered mobile number, Aadhaar number or email</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="9876543210 / 123412341234 / you@example.com"
                  className={field}
                />
              </div>

              <button
                type="button"
                onClick={handleFindId}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                <IdCard className="h-3.5 w-3.5" /> Find my Login ID
              </button>

              {maskedEmail && (
                <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                  Your login ID (email) is <span className="font-semibold">{maskedEmail}</span>. You can also sign in with
                  your mobile number or Aadhaar number.
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="text-xs font-semibold">Verify it is you</label>
                <input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  inputMode="numeric"
                  placeholder="Registered 10-digit mobile, or last 4 digits of Aadhaar"
                  className={field}
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  This second check stops anyone else from changing your password.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">New password (more than 8 characters)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setPassword(p);
                      setConfirm(p);
                      setShow(true);
                      toast.success("Strong password suggested — your browser can save it.");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <Wand2 className="h-3 w-3" /> Suggest a strong password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className={field + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label="Show password"
                    className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.tone : "bg-muted"}`}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{strength.label}</div>
              </div>

              <div>
                <label className="text-xs font-medium">Confirm new password</label>
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={field}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save new password"}
              </button>
            </form>
          )}

          <Link
            to="/auth"
            search={{ profile: undefined, redirect: "/dashboard" }}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
