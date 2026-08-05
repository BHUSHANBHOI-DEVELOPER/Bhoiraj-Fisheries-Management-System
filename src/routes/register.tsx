import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { generatePassword, ratePassword } from "@/lib/password";
import { registerAccount, checkAvailability } from "@/lib/registration.functions";
import { toast } from "sonner";
import { z } from "zod";
import {
  UserPlus, CheckCircle2, Eye, EyeOff, Sparkles, Copy, ShieldCheck, Wrench, Users, Search,
} from "lucide-react";

type Role = "member" | "chairman" | "admin";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { role?: Role } => ({
    role: s.role === "chairman" || s.role === "admin" || s.role === "member" ? (s.role as Role) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Registration — Admin, Chairman or Member | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Register for the Bhoiraj Matsya Vyavsayik Sahakari Sanstha portal as Admin, Chairman or Member. Each role has its own login." },
      { property: "og:title", content: "Registration — Admin, Chairman or Member" },
      { property: "og:description", content: "Create your portal account. Members are approved by the Chairman; Admin and Chairman accounts sign in directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const ROLE_META: Record<Role, { label: string; blurb: string; icon: typeof Users; tone: string }> = {
  member: { label: "Register as a Member", blurb: "Society membership — approved by the Chairman before login.", icon: Users, tone: "bg-primary" },
  chairman: { label: "Register as Chairman", blurb: "Full control of members, documents, dam audits and notices.", icon: ShieldCheck, tone: "bg-saffron" },
  admin: { label: "Register as Admin / Developer", blurb: "Technical and data administration for the whole portal.", icon: Wrench, tone: "bg-teal" },
};

const empty = {
  full_name: "", father_husband_name: "", surname: "", phone: "", alt_phone: "", email: "",
  aadhaar_number: "", pan: "", eshram_number: "", dob: "", village: "",
  taluka: "", district: "", address: "", password: "", user_handle: "", invite_code: "",
};

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  email: z.string().trim().email("Enter a valid email").max(255),
  aadhaar_number: z.string().trim().regex(/^$|^[0-9]{12}$/, "Aadhaar must be exactly 12 digits"),
  pan: z.string().trim().regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must look like ABCDE1234F"),
  dob: z.string().min(1, "Date of birth is required"),
  password: z.string().min(9, "Password must be more than 8 characters").max(72),
});

const staffSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  email: z.string().trim().email("Enter a valid email").max(255),
  user_handle: z.string().trim().regex(/^[a-z][a-z0-9._-]{2,31}$/i, "User ID: 3+ characters, start with a letter"),
  password: z.string().min(9, "Password must be more than 8 characters").max(72),
});

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function RegisterPage() {
  const { role: initialRole } = useSearch({ from: "/register" });
  const [role, setRole] = useState<Role>(initialRole ?? "member");
  const [form, setForm] = useState(empty);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ loginId: string; needsApproval: boolean } | null>(null);
  const navigate = useNavigate();

  const submitRegistration = useServerFn(registerAccount);
  const lookup = useServerFn(checkAvailability);

  const strength = useMemo(() => ratePassword(form.password), [form.password]);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== form.password;
  const isStaff = role !== "member";
  const meta = ROLE_META[role];
  const RoleIcon = meta.icon;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({
      ...f,
      [k]: k === "pan" ? e.target.value.toUpperCase() : k === "user_handle" ? e.target.value.toLowerCase() : e.target.value,
    }));

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

  async function checkNow() {
    setBusy(true);
    try {
      const res = await lookup({ data: { email: form.email, user_handle: form.user_handle } });
      const parts: string[] = [];
      if (res.emailFound === true) parts.push(`Email ${form.email}: FOUND — already registered.`);
      if (res.emailFound === false) parts.push(`Email ${form.email}: NOT FOUND — free to use.`);
      if (res.handleFound === true) parts.push(`User ID "${form.user_handle}": FOUND — already taken.`);
      if (res.handleFound === false) parts.push(`User ID "${form.user_handle}": NOT FOUND — free to use.`);
      if (parts.length === 0) toast.error("Enter an email or User ID to check.");
      else if (res.emailFound || res.handleFound) toast.error(parts.join(" "));
      else toast.success(parts.join(" "));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check right now");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = isStaff ? staffSchema.safeParse(form) : memberSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!isStaff && form.alt_phone && form.alt_phone === form.phone) {
      return toast.error("The alternate mobile number must be different from the main mobile number.");
    }
    if (confirmPassword !== form.password) return toast.error("The two passwords do not match.");
    if (strength.score < 2) return toast.error("Please choose a stronger password — tap 'Suggest a strong password'.");
    if (!isStaff && age(form.dob) < 20) {
      return toast.error("Only applicants aged 20 years or older can be granted login access.");
    }

    setBusy(true);
    try {
      const res = await submitRegistration({ data: { ...form, role } });
      setDone({ loginId: res.loginId, needsApproval: res.needsApproval });
      toast.success(res.needsApproval ? "Application submitted for Chairman approval." : "Your account is ready — you can sign in now.");
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
            <h1 className="mt-4 font-display text-2xl font-bold">
              {done.needsApproval ? "Application submitted" : `${role === "chairman" ? "Chairman" : "Admin"} account created`}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {done.needsApproval
                ? "The Chairman has been notified. Once approved, your name appears in the registered members list and you get full member access."
                : "Your rights are active immediately. No approval from anyone else is needed."}
            </p>
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-left text-xs">
              <div className="font-semibold">Your login details</div>
              <div className="mt-1">Login ID: {done.loginId}{isStaff ? ` (or ${form.email} / ${form.phone})` : " (or your mobile / Aadhaar number)"}</div>
              <div className="mt-0.5">Password: <span className="font-mono">{form.password}</span></div>
              <div className="mt-2 text-muted-foreground">
                Sign in on the {role === "chairman" ? "Chairman" : role === "admin" ? "Admin / Developer" : "Member"} portal. Save these in your browser or password manager now.
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/auth", search: { profile: role, redirect: "/dashboard" } })}
              className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Go to {role === "member" ? "Member" : role === "chairman" ? "Chairman" : "Admin"} login
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
          <h1 className="mt-4 flex flex-wrap items-center gap-3 font-display text-3xl font-bold md:text-4xl">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${meta.tone}`}><RoleIcon className="h-6 w-6" /></span>
            {meta.label}
          </h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">{meta.blurb}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["member", "chairman", "admin"] as Role[]).map((r) => {
            const m = ROLE_META[r];
            const I = m.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-2xl border p-4 text-left transition ${
                  role === r ? "border-primary bg-primary/5 shadow-elev" : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <I className={`h-5 w-5 ${role === r ? "text-primary" : "text-muted-foreground"}`} />
                <div className="mt-2 text-sm font-bold">{m.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name *" value={form.full_name} onChange={set("full_name")} required autoComplete="given-name" />
            <Field label="Surname" value={form.surname} onChange={set("surname")} autoComplete="family-name" />
            {!isStaff && <Field label="Father's / Husband's Name" value={form.father_husband_name} onChange={set("father_husband_name")} />}
            <Field label="Mobile Number *" value={form.phone} onChange={set("phone")} required inputMode="numeric" maxLength={10} placeholder="10 digits" autoComplete="tel" />
            {!isStaff && <Field label="Alternate Mobile Number" value={form.alt_phone} onChange={set("alt_phone")} inputMode="numeric" maxLength={10} placeholder="Optional — 10 digits" />}
            <Field label="Email *" type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
            <Field
              label={isStaff ? "User ID * (used for login)" : "User ID (optional)"}
              value={form.user_handle}
              onChange={set("user_handle")}
              required={isStaff}
              maxLength={32}
              placeholder="e.g. bhushan.admin"
              autoComplete="username"
            />
            {!isStaff && (
              <>
                <Field label="Aadhaar Card Number (optional)" value={form.aadhaar_number} onChange={set("aadhaar_number")} inputMode="numeric" maxLength={12} placeholder="12 digits" />
                <Field label="PAN Card Number" value={form.pan} onChange={set("pan")} maxLength={10} placeholder="ABCDE1234F" />
                <Field label="e-Shram Card Number" value={form.eshram_number} onChange={set("eshram_number")} />
                <Field label="Date of Birth *" type="date" value={form.dob} onChange={set("dob")} required autoComplete="bday" />
                <Field label="Village" value={form.village} onChange={set("village")} />
                <Field label="Taluka" value={form.taluka} onChange={set("taluka")} />
                <Field label="District" value={form.district} onChange={set("district")} />
              </>
            )}
            {isStaff && (
              <Field
                label="Invite code (only if a Chairman / Admin already exists)"
                value={form.invite_code}
                onChange={set("invite_code")}
                placeholder="Leave blank for the first account"
              />
            )}
          </div>

          {!isStaff && (
            <div className="mt-4">
              <label className="text-xs font-medium">Address</label>
              <textarea value={form.address} onChange={set("address")} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          <button
            type="button"
            onClick={checkNow}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" /> Check if this email / User ID already exists
          </button>

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
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.tone : "bg-border"}`} />
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
              Your password is shown above so you can save it in Google Password Manager or your browser.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-md bg-saffron px-6 py-3 text-sm font-semibold text-saffron-foreground shadow-elev hover:brightness-95 disabled:opacity-50">
              {busy ? "Submitting..." : isStaff ? `Create ${role === "chairman" ? "Chairman" : "Admin"} account` : "Submit registration"}
            </button>
            <Link to="/auth" search={{ profile: role, redirect: "/dashboard" }} className="text-sm text-muted-foreground hover:text-foreground">
              Already registered? Sign in →
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {isStaff
              ? "Chairman and Admin accounts sign in with their own User ID and password — no approval from anyone else is required."
              : "Your Aadhaar, PAN and e-Shram details are stored securely and are visible only to the Chairman."}
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
