import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { generatePassword, ratePassword } from "@/lib/password";
import { toast } from "sonner";
import { z } from "zod";
import { UserPlus, CheckCircle2, Eye, EyeOff, Sparkles, Copy } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "New Member Registration | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Register as a new member of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. Approval by the Chairman." },
      { property: "og:title", content: "New Member Registration" },
      { property: "og:description", content: "Apply for membership of the fisheries cooperative society. Chairman approval required." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  father_husband_name: z.string().trim().max(100).optional().or(z.literal("")),
  surname: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  alt_phone: z.string().trim().regex(/^[0-9]{10}$/, "Alternate mobile number must be 10 digits").optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  aadhaar_number: z.string().trim().regex(/^$|^[0-9]{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal("")),
  pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must look like ABCDE1234F").optional().or(z.literal("")),
  eshram_number: z.string().trim().max(20).optional().or(z.literal("")),
  dob: z.string().min(1, "Date of birth is required"),
  village: z.string().trim().max(80).optional().or(z.literal("")),
  taluka: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  password: z.string().min(9, "Password must be more than 8 characters").max(72),
});

const empty = {
  full_name: "", father_husband_name: "", surname: "", phone: "", alt_phone: "", email: "",
  aadhaar_number: "", pan: "", eshram_number: "", dob: "", village: "",
  taluka: "", district: "", address: "", password: "",
};

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function RegisterPage() {
  const [form, setForm] = useState(empty);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => ratePassword(form.password), [form.password]);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== form.password;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: k === "pan" ? e.target.value.toUpperCase() : e.target.value }));

  function suggestPassword() {
    const pw = generatePassword(form.full_name);
    setForm((f) => ({ ...f, password: pw }));
    setConfirmPassword(pw);
    setShowPassword(true);
    toast.success("A strong password has been filled in — your browser will offer to save it.");
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.password);
      toast.success("Password copied. Keep it somewhere safe.");
    } catch {
      toast.error("Could not copy — please note the password manually.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (form.alt_phone && form.alt_phone === form.phone) {
      toast.error("The alternate mobile number must be different from the main mobile number.");
      return;
    }
    if (confirmPassword !== form.password) {
      toast.error("The two passwords do not match.");
      return;
    }
    if (strength.score < 2) {
      toast.error("Please choose a stronger password — tap 'Suggest a strong password'.");
      return;
    }
    if (age(form.dob) < 20) {
      toast.error("Only applicants aged 20 years or older can be granted login access.");
      return;
    }
    setBusy(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: `${form.full_name} ${form.surname}`.trim() },
        },
      });
      if (signUpError) {
        if (/weak|pwned|known|leaked/i.test(signUpError.message)) {
          toast.error(
            "That password appears in public lists of leaked passwords. Tap 'Suggest a strong password' to get a safe one.",
          );
          return;
        }
        if (!/already registered/i.test(signUpError.message)) throw signUpError;
      }

      let userId = signUpData?.user?.id ?? null;
      if (!signUpData?.session) {
        const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError && /invalid/i.test(signInError.message)) {
          toast.error("This email is already registered. Please sign in instead, or use a different email.");
          return;
        }
        userId = signIn?.user?.id ?? userId;
      }
      if (!userId) {
        toast.error("Could not create your login. Please check the email address and try again.");
        return;
      }

      const { error } = await supabase.from("membership_applications").insert({
        user_id: userId,
        full_name: form.full_name,
        father_husband_name: form.father_husband_name || null,
        surname: form.surname || null,
        phone: form.phone,
        alt_phone: form.alt_phone || null,
        email: form.email,
        aadhaar_number: form.aadhaar_number || null,
        pan: form.pan || null,
        eshram_number: form.eshram_number || null,
        dob: form.dob,
        village: form.village || null,
        taluka: form.taluka || null,
        district: form.district || null,
        address: form.address || null,
      });
      if (error) {
        if (/already registered|duplicate|unique/i.test(error.message)) {
          toast.error("This mobile number is already registered or has a pending application.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      await supabase.from("notifications").insert({
        is_broadcast: false,
        recipient_id: userId,
        title: "Application received",
        body: "Your membership application has been sent to the Chairman for approval.",
        category: "membership",
      });

      setDone(true);
      toast.success("Application submitted for Chairman approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-wave-gradient">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-3xl border border-border bg-card/85 p-10 shadow-elev backdrop-blur">
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
            <h1 className="mt-4 font-display text-2xl font-bold">Application submitted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The Chairman has been notified. Once approved, your name appears in the registered members list and you get full member access.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-left text-xs">
              <div className="font-semibold">Your login details</div>
              <div className="mt-1">Login ID: {form.email} (or your mobile / Aadhaar number)</div>
              <div className="mt-0.5">Password: <span className="font-mono">{form.password}</span></div>
              <div className="mt-2 text-muted-foreground">Save these in your browser or password manager now.</div>
            </div>
            <button onClick={() => navigate({ to: "/dashboard" })} className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Go to my portal
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> New User Registration
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Register as a member</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Fill in your details below. A unique mobile number is mandatory, Aadhaar is optional, and applicants must be at least 20 years old.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name *" value={form.full_name} onChange={set("full_name")} required autoComplete="given-name" />
            <Field label="Father's / Husband's Name" value={form.father_husband_name} onChange={set("father_husband_name")} />
            <Field label="Surname" value={form.surname} onChange={set("surname")} autoComplete="family-name" />
            <Field label="Mobile Number *" value={form.phone} onChange={set("phone")} required inputMode="numeric" maxLength={10} placeholder="10 digits" autoComplete="tel" />
            <Field label="Alternate Mobile Number" value={form.alt_phone} onChange={set("alt_phone")} inputMode="numeric" maxLength={10} placeholder="Optional — 10 digits" />
            <Field label="Email *" type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
            <Field label="Aadhaar Card Number (optional)" value={form.aadhaar_number} onChange={set("aadhaar_number")} inputMode="numeric" maxLength={12} placeholder="12 digits" />
            <Field label="PAN Card Number" value={form.pan} onChange={set("pan")} maxLength={10} placeholder="ABCDE1234F" />
            <Field label="e-Shram Card Number" value={form.eshram_number} onChange={set("eshram_number")} />
            <Field label="Date of Birth *" type="date" value={form.dob} onChange={set("dob")} required autoComplete="bday" />
            <Field label="Village" value={form.village} onChange={set("village")} />
            <Field label="Taluka" value={form.taluka} onChange={set("taluka")} />
            <Field label="District" value={form.district} onChange={set("district")} />
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium">Address</label>
            <textarea value={form.address} onChange={set("address")} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Create your password</div>
              <button
                type="button"
                onClick={suggestPassword}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Sparkles className="h-3.5 w-3.5 text-saffron" /> Suggest a strong password
              </button>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium" htmlFor="reg-password">New password *</label>
                <div className="relative mt-1">
                  <input
                    id="reg-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set("password")}
                    required
                    minLength={9}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 pr-16 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
                    {form.password && (
                      <button type="button" onClick={copyPassword} aria-label="Copy password" className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" htmlFor="reg-password-confirm">Confirm password *</label>
                <input
                  id="reg-password-confirm"
                  name="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={9}
                  className={`mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                    mismatch ? "border-destructive" : "border-input"
                  }`}
                />
                {mismatch && <p className="mt-1 text-xs text-destructive">The two passwords do not match.</p>}
              </div>
            </div>

            {form.password && (
              <div className="mt-3">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.tone : "bg-border"}`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium">{strength.label}</span>
                  {strength.hints.slice(0, 2).map((h) => (
                    <span key={h} className="text-muted-foreground">• {h}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Passwords must be more than 8 characters and must not appear in public lists of leaked passwords. Your
              password is shown above so you can save it in Google Password Manager or your browser.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-md bg-saffron px-6 py-3 text-sm font-semibold text-saffron-foreground shadow-elev hover:brightness-95 disabled:opacity-50">
              {busy ? "Submitting..." : "Submit registration"}
            </button>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              Already registered? Sign in →
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Your Aadhaar, PAN and e-Shram details are stored securely and are visible only to the Chairman.
          </p>
        </div>
      </form>
      <SiteFooter />
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...rest} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
