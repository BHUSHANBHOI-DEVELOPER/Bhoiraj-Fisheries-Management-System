import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents | Bhoraj Fisheries" }] }),
  component: Documents,
});

function Documents() {
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id,title,description,file_type,file_size,created_at,category")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = data.filter((d) =>
    !q.trim() || (d.title?.toLowerCase().includes(q.toLowerCase()) || d.description?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">All society documents in one searchable vault.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or description..."
          className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No documents yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              An administrator can upload PDFs, spreadsheets and photos from the Admin panel.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-muted/40">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.category ?? "General"} · {d.file_type ?? ""} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button className="rounded-md border border-border p-2 hover:bg-muted" title="Download">
                  <Download className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
