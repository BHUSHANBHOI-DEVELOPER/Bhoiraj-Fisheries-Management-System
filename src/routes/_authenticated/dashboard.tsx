import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Waves, Bot, Megaphone, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Bhoiraj Matsya Sanstha" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [members, docs, audits, announcements] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("audit_reports").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id,title,body,published_at").eq("is_active", true).order("published_at", { ascending: false }).limit(4),
      ]);
      return {
        members: members.count ?? 0,
        docs: docs.count ?? 0,
        audits: audits.count ?? 0,
        announcements: announcements.data ?? [],
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome</div>
        <h1 className="font-display text-3xl font-bold">
          {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin ? "You have administrator access to the society portal." : "Access documents, audits and the AI assistant."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Members" value={stats?.members ?? "—"} accent="teal" />
        <Stat icon={<FileText className="h-5 w-5" />} label="Documents" value={stats?.docs ?? "—"} accent="saffron" />
        <Stat icon={<Waves className="h-5 w-5" />} label="Dam Audits" value={stats?.audits ?? "—"} accent="accent" />
        <Stat icon={<Bot className="h-5 w-5" />} label="AI Assistant" value="Ready" accent="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent announcements</h2>
            <Link to="/announcements" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {(stats?.announcements ?? []).length === 0 && (
              <div className="py-6 text-sm text-muted-foreground">No announcements yet.</div>
            )}
            {stats?.announcements.map((a) => (
              <div key={a.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-saffron" />
                  <div className="font-medium text-foreground">{a.title}</div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <QuickCard to="/chat" title="Ask the AI Assistant" desc="Search society documents and get instant answers." icon={<Bot className="h-5 w-5" />} />
          <QuickCard to="/documents" title="Browse Documents" desc="Find PDFs, spreadsheets and images." icon={<FileText className="h-5 w-5" />} />
          <QuickCard to="/audits" title="Dam Audit Reports" desc="Yearly audits with cost and findings." icon={<Waves className="h-5 w-5" />} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) {
  const bg = accent === "saffron" ? "bg-saffron/15 text-saffron"
    : accent === "teal" ? "bg-teal/15 text-teal"
    : accent === "accent" ? "bg-accent/20 text-accent-foreground"
    : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${bg}`}>{icon}</div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickCard({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-elev">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
