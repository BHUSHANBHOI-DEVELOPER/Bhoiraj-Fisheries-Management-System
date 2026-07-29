import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Users, Search, Phone, Lock } from "lucide-react";

export const Route = createFileRoute("/registered-members")({
  head: () => ({
    meta: [
      { title: "Registered Members | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Public list of approved members of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { property: "og:title", content: "Registered Members" },
      { property: "og:description", content: "Approved members of the fisheries cooperative society, searchable by name, village or membership number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisteredMembers,
});

function RegisteredMembers() {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["members-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("members_public")
        .select("id,full_name,surname,village,taluka,membership_number,join_date")
        .order("full_name");
      return data ?? [];
    },
  });

  // Contact numbers are shared only with signed-in members (family/society connection).
  const { data: contacts = {} } = useQuery({
    queryKey: ["members-contacts", !!user],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("members").select("id,phone");
      return Object.fromEntries((data ?? []).map((m) => [m.id, m.phone]));
    },
  });

  const filtered = data.filter((m) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [m.full_name, m.surname, m.village, m.membership_number].some((v) => v?.toLowerCase().includes(s));
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Registered Members</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Members approved by the Chairman appear here immediately. Personal documents and identity numbers are never shown publicly.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, village or membership number..."
            className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {!user && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Contact numbers are visible only to signed-in members of the society.
          </div>
        )}

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No members found</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="font-display text-lg font-semibold">
                  {m.full_name} {m.surname ?? ""}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {[m.village, m.taluka].filter(Boolean).join(", ") || "—"}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{m.membership_number ?? "—"}</span>
                  {user && contacts[m.id!] ? (
                    <a href={`tel:${contacts[m.id!]}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {contacts[m.id!]}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
