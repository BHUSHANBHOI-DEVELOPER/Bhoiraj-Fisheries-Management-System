import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { claimAdminInvite } from "@/lib/admin-invites.functions";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Login & Security | Bhoiraj Matsya Sanstha" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin, isSuperAdmin, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const claim = useServerFn(claimAdminInvite);

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      toast.success("Confirmation sent to the new email address.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the login ID");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length <= 8) return toast.error("Password must be more than 8 characters.");
    if (password !== confirm) return toast.error("The two passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await claim({ data: { code } });
      setCode("");
      toast.success("Code accepted. The Chairman has been notified and must approve it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit the code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold">My Login &amp; Security</h1>
        <p className="text-sm text-muted-foreground">
          Change your login ID or password at any time. You can also sign in with your mobile or Aadhaar number.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-medium">{user?.email}</div>
            <div className="text-xs text-muted-foreground">
              Role: {isSuperAdmin ? "Admin / Developer" : isAdmin ? "Chairman" : "Member"}
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={changeEmail} className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-medium">
            <Mail className="h-4 w-4 text-primary" /> Change login ID (email)
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={busy}
            className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Update login ID
          </button>
        </form>

        <form onSubmit={changePassword} className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4 text-primary" /> Change password
          </div>
          <input
            type="password"
            placeholder="New password (more than 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={9}
            required
            className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={9}
            required
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={busy}
            className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Update password
          </button>
        </form>
      </div>

      {!isAdmin && (
        <form onSubmit={submitCode} className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-saffron" /> Have an admin invite code?
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Admin rights are only granted with the Chairman&apos;s permission. Enter the code issued to you; the Chairman
            must then approve it.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDE-12345"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              disabled={busy}
              className="rounded-md bg-saffron px-4 py-2 text-sm font-semibold text-saffron-foreground hover:brightness-95 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
