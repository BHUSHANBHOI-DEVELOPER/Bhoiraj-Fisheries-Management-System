import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { recoverLoginId, requestPasswordReset } from "@/lib/auth.functions";
import { toast } from "sonner";
import { KeyRound, IdCard, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password or Login ID | Bhoiraj Matsya Sanstha" },
      {
        name: "description",
        content:
          "Recover your portal login ID or reset your password using your registered mobile number, Aadhaar number or email.",
      },
      { property: "og:title", content: "Forgot Password or Login ID" },
      { property: "og:description", content: "Account recovery for Chairman and members of the fisheries cooperative society." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const recover = useServerFn(recoverLoginId);
  const reset = useServerFn(requestPasswordReset);

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

  async function handleReset() {
    if (identifier.trim().length < 3) return toast.error("Enter your mobile, Aadhaar number or email.");
    setBusy(true);
    try {
      const res = await reset({
        data: { identifier, redirectTo: `${window.location.origin}/reset-password` },
      });
      if (res.sent) {
        toast.success(`A password reset link was sent to ${res.maskedEmail}.`);
      } else {
        toast.error("No account found for that mobile number / Aadhaar number / email.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the reset link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Forgot Login ID or Password</h1>
              <p className="text-xs text-muted-foreground">
                Works for both the Chairman and members. Every recovery request is recorded.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium">Registered mobile number, Aadhaar number or email</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 / 123412341234 / you@example.com"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleFindId}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <IdCard className="h-4 w-4" /> Find my Login ID
              </button>
              <button
                onClick={handleReset}
                disabled={busy}
                className="flex-1 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Send password reset link
              </button>
            </div>

            {maskedEmail && (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                Your login ID (email) is <span className="font-semibold">{maskedEmail}</span>. You can also sign in
                directly with your mobile number or Aadhaar number.
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The reset link is delivered to the email on your membership record. Passwords must be more than 8
              characters.
            </p>
          </div>

          <Link
            to="/auth"
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
