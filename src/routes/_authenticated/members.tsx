import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members | Bhoraj Fisheries" }] }),
  component: Members,
});

function Members() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("members")
        .select("id,full_name,phone,village,membership_number,join_date")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive/70" />
        <div className="mt-3 font-semibold">Administrators only</div>
        <p className="mt-1 text-sm text-muted-foreground">Member records contain personal information and are restricted.</p>
      </div>
    );
  }

  const filtered = data.filter((m) =>
    !q.trim() ||
    m.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    m.phone?.includes(q) ||
    m.membership_number?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">Search and manage cooperative members.</p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or membership number..." className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No members yet</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Membership #</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">{m.membership_number ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{m.full_name}</td>
                  <td className="px-4 py-3">{m.phone ?? "—"}</td>
                  <td className="px-4 py-3">{m.village ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.join_date ? new Date(m.join_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
