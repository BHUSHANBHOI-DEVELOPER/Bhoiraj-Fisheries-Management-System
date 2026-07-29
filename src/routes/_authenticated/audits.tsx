import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Waves, Calendar, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audits")({
  head: () => ({ meta: [{ title: "Dam Audits | Bhoiraj Matsya Sanstha" }] }),
  component: Audits,
});

function Audits() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_reports")
        .select("*")
        .order("audit_year", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dam Audit Reports</h1>
        <p className="text-sm text-muted-foreground">Yearly audit history — costs, findings and linked documents.</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading...</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Waves className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <div className="mt-3 font-medium">No audit reports yet</div>
          <p className="mt-1 text-sm text-muted-foreground">Administrators can add audit reports from the Admin panel.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal">
                  <Waves className="h-5 w-5" />
                  <span className="font-semibold">{r.dam_name ?? "Dam"}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Calendar className="h-3 w-3" /> {r.audit_year}
                </span>
              </div>
              {r.total_cost != null && (
                <div className="mt-4 flex items-center gap-1 text-2xl font-bold">
                  <IndianRupee className="h-5 w-5" />{Number(r.total_cost).toLocaleString("en-IN")}
                </div>
              )}
              {r.findings && <p className="mt-3 text-sm text-muted-foreground">{r.findings}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
