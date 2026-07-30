import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FileText, Download, Search, Upload, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Document Vault | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Searchable vault of society documents — PDFs, spreadsheets and photos organised in folders with tags." },
      { property: "og:title", content: "Document Vault" },
      { property: "og:description", content: "Search society PDFs, Excel files and photos by folder and tag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Documents,
});

const FOLDERS = ["general", "registration", "audit", "minutes", "finance", "schemes", "photos"] as const;

function Documents() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string>("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id,title,description,file_type,file_size,uploaded_at,category,tags,file_path")
        .order("uploaded_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((d) => {
      if (folder !== "all" && (d.category ?? "general") !== folder) return false;
      if (!needle) return true;
      return (
        d.title?.toLowerCase().includes(needle) ||
        d.description?.toLowerCase().includes(needle) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(needle)) ||
        (d.file_type ?? "").toLowerCase().includes(needle)
      );
    });
  }, [data, q, folder]);

  async function download(path: string, name: string) {
    const { data: signed, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
    if (error || !signed) {
      toast.error("Could not open this file.");
      return;
    }
    const a = document.createElement("a");
    a.href = signed.signedUrl;
    a.download = name;
    a.target = "_blank";
    a.click();
  }

  async function remove(id: string, path: string) {
    if (!confirm("Delete this document permanently?")) return;
    await supabase.storage.from("documents").remove([path]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Document deleted.");
    qc.invalidateQueries({ queryKey: ["documents"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Document Vault</h1>
        <p className="text-sm text-muted-foreground">
          All society documents in one searchable vault — search by title, description, tag or file type.
        </p>
      </div>

      {isAdmin && <UploadForm ownerId={user?.id ?? ""} onDone={() => qc.invalidateQueries({ queryKey: ["documents"] })} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, description, tag or file type..."
            className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="all">All folders</option>
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No documents found</div>
            <p className="mt-1 text-sm text-muted-foreground">
              The Chairman can upload PDFs, Excel sheets and photos using the form above.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-muted/40">
                <div className="grid h-10 w-10 place-items-center rounded bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.category ?? "general"} · {d.file_type ?? ""} ·{" "}
                    {d.file_size ? `${Math.round(Number(d.file_size) / 1024)} KB · ` : ""}
                    {new Date(d.uploaded_at).toLocaleDateString()}
                  </div>
                  {(d.tags ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(d.tags ?? []).map((t) => (
                        <span key={t} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => download(d.file_path, d.title ?? "document")}
                  className="rounded-md border border-border p-2 hover:bg-muted"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => remove(d.id, d.file_path)}
                    className="rounded-md border border-border p-2 text-destructive hover:bg-muted"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UploadForm({ ownerId, onDone }: { ownerId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Choose a file to upload.");
    if (!title.trim()) return toast.error("Enter a title.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${category}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from("documents").insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        file_path: path,
        file_name: file.name,
        file_type: ext.toUpperCase(),
        file_size: file.size,
        owner_id: ownerId,
        visibility: "members",
      });
      if (error) throw error;
      toast.success("Document uploaded.");
      setTitle("");
      setDescription("");
      setTags("");
      setFile(null);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-medium">
        <Upload className="h-4 w-4" /> Upload a document (PDF, Excel, Word or photo)
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title *"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              Folder: {f}
            </option>
          ))}
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags, comma separated (e.g. 2024, dam, receipt)"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Upload to vault"}
        </button>
      </div>
    </form>
  );
}
