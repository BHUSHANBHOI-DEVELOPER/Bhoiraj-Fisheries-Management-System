import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { uploadMedia } from "@/lib/media";
import { toast } from "sonner";
import { ShieldAlert, UserCheck, Image as ImageIcon, Trophy, Waves, Sparkles, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Chairman control panel: approve members, manage documents, promotional photos, dams, schemes and notifications." },
      { property: "og:title", content: "Admin Panel" },
      { property: "og:description", content: "Chairman control panel for the fisheries cooperative society." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const TABS = [
  { id: "approvals", label: "Member approvals", icon: UserCheck },
  { id: "notify", label: "Notifications", icon: Send },
  { id: "promos", label: "Promotional photos", icon: ImageIcon },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "dams", label: "Lakes & dams", icon: Waves },
  { id: "schemes", label: "Schemes", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("approvals");

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive/70" />
        <div className="mt-3 font-semibold">Chairman / administrators only</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Chairman Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Full control — approvals, notifications, photos, dams and schemes, from anywhere.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              tab === tb.id ? "border-saffron bg-saffron text-saffron-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <tb.icon className="h-4 w-4" /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "approvals" && <Approvals />}
      {tab === "notify" && <NotifyPanel />}
      {tab === "promos" && <PromoPanel />}
      {tab === "achievements" && <AchievementPanel />}
      {tab === "dams" && <DamPanel />}
      {tab === "schemes" && <SchemePanel />}
    </div>
  );
}

/* ---------------- Member approvals ---------------- */

function Approvals() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_applications")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function decide(app: (typeof data)[number], approve: boolean) {
    setBusy(app.id);
    try {
      if (approve) {
        const membershipNumber = `BMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const { error } = await supabase.from("members").insert({
          user_id: app.user_id,
          membership_number: membershipNumber,
          full_name: app.full_name,
          surname: app.surname,
          father_husband_name: app.father_husband_name,
          father_name: app.father_husband_name,
          phone: app.phone,
          email: app.email,
          aadhaar_number: app.aadhaar_number,
          aadhaar_last4: app.aadhaar_number.slice(-4),
          pan: app.pan,
          eshram_number: app.eshram_number,
          dob: app.dob,
          village: app.village,
          taluka: app.taluka,
          district: app.district,
          address: app.address,
          approval_status: "approved",
          approved_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      await supabase
        .from("membership_applications")
        .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", app.id);

      if (app.user_id) {
        await supabase.from("notifications").insert({
          recipient_id: app.user_id,
          title: approve ? "Membership approved" : "Membership application declined",
          body: approve
            ? "Welcome! Your membership is approved and your name now appears in the registered members list."
            : "Please contact the Chairman for details.",
          category: "membership",
        });
      }
      toast.success(approve ? "Member approved and published." : "Application rejected.");
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return <Loading />;
  const pending = data.filter((a) => a.status === "pending");

  return (
    <Panel title="Membership applications" subtitle={`${pending.length} awaiting your approval`}>
      {data.length === 0 ? (
        <Empty text="No applications yet" />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {a.full_name} {a.surname ?? ""}{" "}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">{a.status}</span>
                  </div>
                  <div className="mt-1 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <span>Father/Husband: {a.father_husband_name ?? "—"}</span>
                    <span>Mobile: {a.phone}</span>
                    <span>Email: {a.email ?? "—"}</span>
                    <span>Aadhaar: {a.aadhaar_number}</span>
                    <span>PAN: {a.pan ?? "—"}</span>
                    <span>e-Shram: {a.eshram_number ?? "—"}</span>
                    <span>DOB: {a.dob}</span>
                    <span>Village: {a.village ?? "—"}</span>
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <button disabled={busy === a.id} onClick={() => decide(a, true)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                      Approve
                    </button>
                    <button disabled={busy === a.id} onClick={() => decide(a, false)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ---------------- Notifications ---------------- */

function NotifyPanel() {
  const [mode, setMode] = useState<"one" | "all">("one");
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["members-for-notify"],
    queryFn: async () => {
      const { data } = await supabase.from("members").select("id,user_id,full_name,phone").not("user_id", "is", null);
      return data ?? [];
    },
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Enter a title");
    if (mode === "one" && !target) return toast.error("Choose a member");
    setBusy(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        recipient_id: mode === "one" ? target : null,
        is_broadcast: mode === "all",
        title: title.trim(),
        body: body.trim() || null,
        category: "admin",
      });
      if (error) throw error;
      toast.success(mode === "all" ? "Sent to all members" : "Sent to the selected member");
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Send a notification" subtitle="Send to one person, or broadcast to the entire group.">
      <form onSubmit={send} className="space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("one")} className={`rounded-md border px-3 py-1.5 text-sm ${mode === "one" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
            One member
          </button>
          <button type="button" onClick={() => setMode("all")} className={`rounded-md border px-3 py-1.5 text-sm ${mode === "all" ? "border-saffron bg-saffron text-saffron-foreground" : "border-border"}`}>
            Whole group
          </button>
        </div>
        {mode === "one" && (
          <div>
            <label className="text-xs font-medium">Member</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.user_id ?? ""}>
                  {m.full_name} — {m.phone}
                </option>
              ))}
            </select>
          </div>
        )}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="text-xs font-medium">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Sending..." : "Send notification"}
        </button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        Notifications appear instantly inside the portal and by email. SMS/WhatsApp delivery can be switched on once a messaging provider account is connected.
      </p>
    </Panel>
  );
}

/* ---------------- Promo images ---------------- */

function PromoPanel() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["promos-admin"],
    queryFn: async () => (await supabase.from("promo_images").select("*").order("sort_order")).data ?? [],
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Choose an image");
    setBusy(true);
    try {
      const url = await uploadMedia(file, "promos");
      const { error } = await supabase.from("promo_images").insert({ title: title || null, caption: caption || null, image_url: url });
      if (error) throw error;
      toast.success("Promotional photo published");
      setTitle(""); setCaption(""); setFile(null);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("promo_images").delete().eq("id", id);
    qc.invalidateQueries();
  }

  return (
    <Panel title="Promotional photos" subtitle="Shown on the home page to everyone, including visitors.">
      <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <FileInput label="Image" onChange={(f) => setFile(f)} />
        <div className="flex items-end">
          <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Uploading..." : "Publish photo"}
          </button>
        </div>
      </form>
      <MediaGrid items={data.map((p) => ({ id: p.id, title: p.title ?? "Promo", image_url: p.image_url }))} onDelete={remove} />
    </Panel>
  );
}

/* ---------------- Achievements ---------------- */

function AchievementPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", summary: "", body: "", achieved_on: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["achievements-admin"],
    queryFn: async () => (await supabase.from("achievements").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Enter a title");
    setBusy(true);
    try {
      const image_url = file ? await uploadMedia(file, "achievements") : null;
      const { error } = await supabase.from("achievements").insert({
        title: form.title,
        summary: form.summary || null,
        body: form.body || null,
        achieved_on: form.achieved_on || null,
        image_url,
      });
      if (error) throw error;
      toast.success("Achievement published");
      setForm({ title: "", summary: "", body: "", achieved_on: "" });
      setFile(null);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("achievements").delete().eq("id", id);
    qc.invalidateQueries();
  }

  return (
    <Panel title="Achievements" subtitle="Publicly visible, with previews on the home page.">
      <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Date" type="date" value={form.achieved_on} onChange={(e) => setForm({ ...form, achieved_on: e.target.value })} />
        <Input label="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <FileInput label="Photo" onChange={setFile} />
        <div className="md:col-span-2">
          <label className="text-xs font-medium">Details</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Saving..." : "Publish achievement"}
          </button>
        </div>
      </form>
      <MediaGrid items={data.map((a) => ({ id: a.id, title: a.title, image_url: a.image_url }))} onDelete={remove} />
    </Panel>
  );
}

/* ---------------- Dams ---------------- */

function DamPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", village: "", taluka: "", district: "", water_area: "", capacity: "", description: "", latest_news: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["dams-admin"],
    queryFn: async () => (await supabase.from("dams").select("*").order("name")).data ?? [],
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Enter the dam / lake name");
    setBusy(true);
    try {
      const image_url = file ? await uploadMedia(file, "dams") : null;
      const { error } = await supabase.from("dams").insert({ ...form, image_url });
      if (error) throw error;
      toast.success("Dam information published");
      setForm({ name: "", village: "", taluka: "", district: "", water_area: "", capacity: "", description: "", latest_news: "" });
      setFile(null);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("dams").delete().eq("id", id);
    qc.invalidateQueries();
  }

  return (
    <Panel title="Lakes & dams" subtitle="Photos, details and news — publicly visible.">
      <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
        <Input label="Taluka" value={form.taluka} onChange={(e) => setForm({ ...form, taluka: e.target.value })} />
        <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        <Input label="Water area" value={form.water_area} onChange={(e) => setForm({ ...form, water_area: e.target.value })} />
        <Input label="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <FileInput label="Photo" onChange={setFile} />
        <Input label="Latest news" value={form.latest_news} onChange={(e) => setForm({ ...form, latest_news: e.target.value })} />
        <div className="md:col-span-2">
          <label className="text-xs font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Saving..." : "Publish dam"}
          </button>
        </div>
      </form>
      <MediaGrid items={data.map((d) => ({ id: d.id, title: d.name, image_url: d.image_url }))} onDelete={remove} />
    </Panel>
  );
}

/* ---------------- Schemes ---------------- */

function SchemePanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", summary: "", body: "", external_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["schemes-admin"],
    queryFn: async () => (await supabase.from("schemes").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Enter a title");
    setBusy(true);
    try {
      const image_url = file ? await uploadMedia(file, "schemes") : null;
      const { error } = await supabase.from("schemes").insert({
        title: form.title,
        summary: form.summary || null,
        body: form.body || null,
        external_url: form.external_url || null,
        image_url,
      });
      if (error) throw error;
      toast.success("Scheme published");
      setForm({ title: "", summary: "", body: "", external_url: "" });
      setFile(null);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("schemes").delete().eq("id", id);
    qc.invalidateQueries();
  }

  return (
    <Panel title="Government schemes" subtitle="Published on the public Schemes page.">
      <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Link (optional)" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
        <Input label="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <FileInput label="Photo" onChange={setFile} />
        <div className="md:col-span-2">
          <label className="text-xs font-medium">Details</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Saving..." : "Publish scheme"}
          </button>
        </div>
      </form>
      <MediaGrid items={data.map((s) => ({ id: s.id, title: s.title, image_url: s.image_url }))} onDelete={remove} />
    </Panel>
  );
}

/* ---------------- shared bits ---------------- */

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...rest} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function FileInput({ label, onChange }: { label: string; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs" />
    </div>
  );
}

function MediaGrid({ items, onDelete }: { items: { id: string; title: string; image_url: string | null }[]; onDelete: (id: string) => void }) {
  if (items.length === 0) return <Empty text="Nothing published yet" />;
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.id} className="overflow-hidden rounded-xl border border-border">
          {it.image_url ? (
            <img src={it.image_url} alt={it.title} loading="lazy" className="h-28 w-full object-cover" />
          ) : (
            <div className="h-28 w-full bg-muted" />
          )}
          <div className="flex items-center justify-between gap-2 p-3">
            <span className="truncate text-xs font-medium">{it.title}</span>
            <button onClick={() => onDelete(it.id)} className="text-destructive/80 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
