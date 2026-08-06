import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, Waves, Bot, Megaphone, ArrowUpRight, ShieldCheck, Wrench, Image as ImageIcon,
  BadgeCheck, Activity, Trophy, Sparkles, Link2, ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Role-based dashboard for the Chairman, Admin and members of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { property: "og:title", content: "Portal Dashboard | Bhoiraj Matsya Sanstha" },
      { property: "og:description", content: "Manage members, documents, dam audits and notices from one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function useSocietyStats(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["dashboard-stats"],
    staleTime: 30_000,
    queryFn: async () => {
      const [members, docs, audits, announcements, pending, promos, dams, achievements] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("audit_reports").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id,title,body,published_at").eq("is_active", true).order("published_at", { ascending: false }).limit(4),
        supabase.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("promo_images").select("id", { count: "exact", head: true }),
        supabase.from("dams").select("id", { count: "exact", head: true }),
        supabase.from("achievements").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: members.count ?? 0,
        docs: docs.count ?? 0,
        audits: audits.count ?? 0,
        pending: pending.count ?? 0,
        promos: promos.count ?? 0,
        dams: dams.count ?? 0,
        achievements: achievements.count ?? 0,
        announcements: announcements.data ?? [],
      };
    },
  });
}

function Dashboard() {
  const { user, isAdmin, isSuperAdmin, activeProfile } = useAuth();
  const { data: stats } = useSocietyStats();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  if (isAdmin && (activeProfile === "admin" || isSuperAdmin)) {
    return <AdminConsole name={name} stats={stats} />;
  }
  if (isAdmin) return <ChairmanConsole name={name} stats={stats} />;
  return <MemberHome name={name} stats={stats} />;
}

type Stats = ReturnType<typeof useSocietyStats>["data"];

/* ------------------------------ ADMIN ------------------------------ */

function AdminConsole({ name, stats }: { name: string; stats: Stats }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <Banner
        eyebrow="Admin / Developer Console"
        title={`Control centre — ${name}`}
        desc="Full technical and data control: every member, every Chairman action, every document and every audit."
        icon={<Wrench className="h-6 w-6" />}
        tone="teal"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Members" value={stats?.members ?? "—"} accent="teal" />
        <Stat icon={<BadgeCheck className="h-5 w-5" />} label="Pending approvals" value={stats?.pending ?? "—"} accent="saffron" />
        <Stat icon={<FileText className="h-5 w-5" />} label="Documents" value={stats?.docs ?? "—"} accent="primary" />
        <Stat icon={<Waves className="h-5 w-5" />} label="Dam audits" value={stats?.audits ?? "—"} accent="accent" />
      </div>

      <Section title="Chairman panel — what the Chairman sees and manages">
        <QuickCard to="/admin" title="Approvals queue" desc={`${stats?.pending ?? 0} membership application(s) awaiting a decision.`} icon={<ClipboardList className="h-5 w-5" />} />
        <QuickCard to="/admin" title="Publish photos & notices" desc="Ponds, harvests, meetings and scheme camps shown on the front page." icon={<ImageIcon className="h-5 w-5" />} />
        <QuickCard to="/audits" title="Dam audit reports" desc="Yearly audits with cost and findings." icon={<Waves className="h-5 w-5" />} />
      </Section>

      <Section title="Member panel — what members see">
        <QuickCard to="/members" title="Member records" desc="View, edit, export and permanently delete member records." icon={<Users className="h-5 w-5" />} />
        <QuickCard to="/documents" title="Document vault" desc="PDF, Excel, Word and image uploads for the whole society." icon={<FileText className="h-5 w-5" />} />
        <QuickCard to="/notifications" title="Notifications" desc="Send to one member, or broadcast to everyone." icon={<Megaphone className="h-5 w-5" />} />
      </Section>

      <Section title="Site & platform">
        <QuickCard to="/admin" title="Feature toggles & social links" desc="Turn features on or off; links appear on the site instantly." icon={<Link2 className="h-5 w-5" />} />
        <QuickCard to="/admin" title="Activity log" desc="Every admin action, login attempt and password change." icon={<Activity className="h-5 w-5" />} />
        <QuickCard to="/chat" title="AI assistant" desc="Search society documents and get instant answers." icon={<Bot className="h-5 w-5" />} />
      </Section>
    </div>
  );
}

/* ----------------------------- CHAIRMAN ---------------------------- */

function ChairmanConsole({ name, stats }: { name: string; stats: Stats }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <Banner
        eyebrow="Chairman's Desk"
        title={`Namaskar, ${name}`}
        desc="Approve members, publish photos and notices, and manage every society record."
        icon={<ShieldCheck className="h-6 w-6" />}
        tone="saffron"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<BadgeCheck className="h-5 w-5" />} label="Awaiting approval" value={stats?.pending ?? "—"} accent="saffron" />
        <Stat icon={<Users className="h-5 w-5" />} label="Approved members" value={stats?.members ?? "—"} accent="teal" />
        <Stat icon={<Waves className="h-5 w-5" />} label="Dams on record" value={stats?.dams ?? "—"} accent="primary" />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Achievements" value={stats?.achievements ?? "—"} accent="accent" />
      </div>

      <Section title="Manage the society">
        <QuickCard to="/admin" title="Approve new members" desc="One-click approve or reject. Approved members appear on the site at once." icon={<ClipboardList className="h-5 w-5" />} />
        <QuickCard to="/members" title="Member database" desc="Full member records with Excel, PDF and Word exports." icon={<Users className="h-5 w-5" />} />
        <QuickCard to="/documents" title="Upload documents" desc="Excel, Word, PDF and images — members can view only." icon={<FileText className="h-5 w-5" />} />
      </Section>

      <Section title="Publish to the public site">
        <QuickCard to="/admin" title="Publish photos" desc="Ponds, harvests, meetings and scheme camps go straight to the front page." icon={<ImageIcon className="h-5 w-5" />} />
        <QuickCard to="/announcements" title="Notices & announcements" desc="Post society notices for members and visitors." icon={<Megaphone className="h-5 w-5" />} />
        <QuickCard to="/audits" title="Dam audit reports" desc="Publish yearly audits with cost and findings." icon={<Waves className="h-5 w-5" />} />
      </Section>

      <Announcements stats={stats} />
    </div>
  );
}

/* ------------------------------ MEMBER ----------------------------- */

function MemberHome({ name, stats }: { name: string; stats: Stats }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <Banner
        eyebrow="Member Portal"
        title={`Welcome, ${name}`}
        desc="View society documents and dam audits, read notices, and message the Chairman or the AI assistant."
        icon={<Users className="h-6 w-6" />}
        tone="primary"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={<FileText className="h-5 w-5" />} label="Documents to view" value={stats?.docs ?? "—"} accent="primary" />
        <Stat icon={<Waves className="h-5 w-5" />} label="Dam audits" value={stats?.audits ?? "—"} accent="teal" />
        <Stat icon={<Sparkles className="h-5 w-5" />} label="AI assistant" value="Ready" accent="saffron" />
      </div>

      <Section title="Your portal">
        <QuickCard to="/chat" title="Ask the AI or the Chairman" desc="Get answers, or send your question to the Chairman." icon={<Bot className="h-5 w-5" />} />
        <QuickCard to="/documents" title="View documents" desc="Read-only access to society records." icon={<FileText className="h-5 w-5" />} />
        <QuickCard to="/account" title="My login & security" desc="Your membership details and password." icon={<ShieldCheck className="h-5 w-5" />} />
      </Section>

      <Announcements stats={stats} />
    </div>
  );
}

/* ------------------------------ shared ----------------------------- */

function Banner({ eyebrow, title, desc, icon, tone }: {
  eyebrow: string; title: string; desc: string; icon: React.ReactNode; tone: "saffron" | "teal" | "primary";
}) {
  const bg = tone === "saffron" ? "bg-saffron text-saffron-foreground"
    : tone === "teal" ? "bg-teal text-primary-foreground"
    : "bg-hero-gradient text-primary-foreground";
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elev">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-elev ${bg}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Announcements({ stats }: { stats: Stats }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
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
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) {
  const bg = accent === "saffron" ? "bg-saffron/15 text-saffron"
    : accent === "teal" ? "bg-teal/15 text-teal"
    : accent === "accent" ? "bg-accent/20 text-accent-foreground"
    : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-elev">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${bg}`}>{icon}</div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickCard({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elev">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:scale-110">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">{title}</div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
