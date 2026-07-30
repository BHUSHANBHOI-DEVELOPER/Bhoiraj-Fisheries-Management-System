import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Waves, Calendar, IndianRupee, Search, Paperclip, Plus, Download } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/audits")({
  head: () => ({
    meta: [
      { title: "Dam Audit Reports | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Dam audit history for the society — yearly expenditure, findings and attached audit files, visible to signed-in members." },
      { property: "og:title", content: "Dam Audit Reports" },
      { property: "og:description", content: "Yearly dam audit expenditure, findings and attached reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Audits,
});

function Audits() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_reports")
        .select("*, documents(id,title,file_path)")
        .order("audit_year", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return data;
    return data.filter(
      (r) =>
        r.title?.toLowerCase().includes(n) ||
        r.dam_name?.toLowerCase().includes(n) ||
        r.area?.toLowerCase().includes(n) ||
        r.findings?.toLowerCase().includes(n) ||
        String(r.audit_year ?? "").includes(n),
    );
  }, [data, q]);

  async function openFile(path: string) {
    const { data: signed, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
    if (error || !signed) return toast.error("Could not open the attachment.");
    window.open(signed.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dam Audit Reports</h1>
          <p className="text-sm text-muted-foreground">Yearly audit history — expenditure, findings and attached reports.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-semibold text-saffron-foreground"
          >
            <Plus className="h-4 w-4" /> {showForm ? "Close form" : "New audit report"}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <AuditForm
          ownerId={user?.id ?? ""}
          onDone={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["audits"] });
          }}
        />
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by dam, area, year or findings..."
          className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-12 text-center">
          <Waves className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <div className="mt-3 font-medium">No audit reports yet</div>
          <p className="mt-1 text-sm text-muted-foreground">The Chairman can add audit reports using the button above.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal">
                  <Waves className="h-5 w-5" />
                  <span className="font-semibold">{r.dam_name ?? "Dam"}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Calendar className="h-3 w-3" /> {r.audit_year}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium">{r.title}</div>
              {r.area && <div className="text-xs text-muted-foreground">Area: {r.area}</div>}
              {r.total_cost != null && (
                <div className="mt-4 flex items-center gap-1 text-2xl font-bold">
                  <IndianRupee className="h-5 w-5" />
                  {Number(r.total_cost).toLocaleString("en-IN")}
                </div>
              )}
              {r.findings && <p className="mt-3 text-sm text-muted-foreground">{r.findings}</p>}
              {r.documents && (
                <button
                  onClick={() => openFile((r.documents as { file_path: string }).file_path)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Open attached report
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditForm({ ownerId, onDone }: { ownerId: string; onDone: () => void }) {
  const [f, setF] = useState({
    title: "",
    dam_name: "",
    area: "",
    audit_year: String(new Date().getFullYear()),
    total_cost: "",
    findings: "",
    status: "final",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.dam_name.trim()) return toast.error("Title and dam name are required.");
    setBusy(true);
    try {
      let documentId: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `audit/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({
            title: `${f.title.trim()} (${f.audit_year})`,
            category: "audit",
            tags: ["audit", f.dam_name.trim(), f.audit_year],
            file_path: path,
            file_name: file.name,
            file_type: ext.toUpperCase(),
            file_size: file.size,
            owner_id: ownerId,
            visibility: "members",
          })
          .select("id")
          .single();
        if (docErr) throw docErr;
        documentId = doc.id;
      }
      const { error } = await supabase.from("audit_reports").insert({
        title: f.title.trim(),
        dam_name: f.dam_name.trim(),
        area: f.area.trim() || null,
        audit_year: Number(f.audit_year) || null,
        total_cost: f.total_cost ? Number(f.total_cost) : null,
        findings: f.findings.trim() || null,
        status: f.status,
        document_id: documentId,
        created_by: ownerId,
      });
      if (error) throw error;
      toast.success("Audit report saved.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the audit report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-card p-5">
      <div className="font-medium">Dam audit registration form</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={f.title} onChange={set("title")} placeholder="Audit title *" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={f.dam_name} onChange={set("dam_name")} placeholder="Dam / lake name *" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={f.area} onChange={set("area")} placeholder="Area / village" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={f.audit_year} onChange={set("audit_year")} inputMode="numeric" placeholder="Audit year" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={f.total_cost} onChange={set("total_cost")} inputMode="decimal" placeholder="Total expenditure (₹)" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <select value={f.status} onChange={set("status")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="draft">Status: draft</option>
          <option value="final">Status: final</option>
        </select>
        <textarea
          value={f.findings}
          onChange={set("findings")}
          rows={3}
          placeholder="Findings and observations"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="flex-1 text-sm"
          />
        </label>
      </div>
      <button
        disabled={busy}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save audit report"}
      </button>
    </form>
  );
}
