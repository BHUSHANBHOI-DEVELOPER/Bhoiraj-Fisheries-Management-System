import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, FileText, Users, Waves, Bot, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t, lang } = useI18n();
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,body,published_at")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("published_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Marquee announcements */}
      {announcements.length > 0 && (
        <div className="border-b border-border bg-secondary">
          <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden px-4 py-2 text-sm">
            <span className="whitespace-nowrap rounded-full bg-saffron px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-saffron-foreground">
              Notice
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="marquee-track flex whitespace-nowrap gap-12">
                {[...announcements, ...announcements].map((a, i) => (
                  <span key={i} className="text-secondary-foreground/90">
                    <strong>{a.title}</strong> — {a.body}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(1200px 500px at 90% -10%, oklch(0.85 0.15 200) 0%, transparent 60%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> {t("hero.badge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-balance md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 md:text-lg">
              {t("hero.subtitle")}
            </p>
            <p className="mt-3 text-sm italic text-accent">{SITE.tagline[lang]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-saffron px-5 py-3 text-sm font-semibold text-saffron-foreground shadow-elev transition hover:brightness-95">
                {t("hero.cta.member")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 bg-primary-foreground/5 px-5 py-3 text-sm font-medium hover:bg-primary-foreground/10">
                {t("hero.cta.learn")}
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-primary-foreground/60">Reg. No.</dt><dd className="font-mono font-semibold">{SITE.regNo}</dd></div>
              <div><dt className="text-primary-foreground/60">Established</dt><dd className="font-semibold">2004</dd></div>
              <div><dt className="text-primary-foreground/60">District</dt><dd className="font-semibold">Jalgaon</dd></div>
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-accent/10 blur-3xl" />
            <div className="relative rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
                <Sparkles className="h-3.5 w-3.5" /> Digital Society Snapshot
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <StatCard label="Members" value="—" />
                <StatCard label="Documents" value="—" />
                <StatCard label="Dam Audits" value="—" />
                <StatCard label="Since" value="2004" />
              </div>
              <div className="mt-6 rounded-xl border border-primary-foreground/10 bg-primary/40 p-4 text-sm">
                <div className="font-semibold text-primary-foreground">Chairman</div>
                <div className="mt-1 text-primary-foreground/80">{SITE.chairman}</div>
                <div className="mt-2 text-xs text-primary-foreground/60">{SITE.chairmanPhone}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromoStrip />
      <AchievementsPreview />

      {/* FEATURES */}

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{t("features.title")}</h2>
          <p className="mt-3 text-muted-foreground">
            Every workflow of the cooperative — from member records to dam audits — in one secure, government-standard portal.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Users className="h-5 w-5" />} title={t("f1.title")} body={t("f1.body")} accent="teal" />
          <FeatureCard icon={<FileText className="h-5 w-5" />} title={t("f2.title")} body={t("f2.body")} accent="saffron" />
          <FeatureCard icon={<Waves className="h-5 w-5" />} title={t("f3.title")} body={t("f3.body")} accent="accent" />
          <FeatureCard icon={<Bot className="h-5 w-5" />} title={t("f4.title")} body={t("f4.body")} accent="primary" />
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-wave-gradient">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{t("society.title")}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t("society.body")}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Registration" value={SITE.regNo} />
              <InfoRow label="Established" value={SITE.establishedOn} />
              <InfoRow label="Area" value={SITE.area} />
              <InfoRow label="District" value="Jalgaon, MH" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Ponds & Dams", icon: <Waves className="h-6 w-6" /> },
              { label: "Registered Members", icon: <Users className="h-6 w-6" /> },
              { label: "Govt. Schemes", icon: <ShieldCheck className="h-6 w-6" /> },
              { label: "Audit Compliance", icon: <FileText className="h-6 w-6" /> },
            ].map((it) => (
              <div key={it.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{it.icon}</div>
                <div className="mt-4 font-display text-lg font-semibold text-foreground">{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-10 text-primary-foreground shadow-elev md:p-16">
          <h3 className="font-display text-3xl font-bold md:text-4xl">Register or access your member portal today</h3>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            Members can upload documents, view dam audit reports, chat with the AI assistant, and stay updated with government scheme benefits.
          </p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-md bg-saffron px-6 py-3 font-semibold text-saffron-foreground shadow-elev hover:brightness-95">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-primary/30 p-4">
      <div className="text-xs uppercase tracking-wider text-primary-foreground/60">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary-foreground">{value}</div>
    </div>
  );
}

function FeatureCard({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent: string }) {
  const bg = accent === "saffron" ? "bg-saffron/15 text-saffron"
    : accent === "teal" ? "bg-teal/15 text-teal"
    : accent === "accent" ? "bg-accent/20 text-accent-foreground"
    : "bg-primary/10 text-primary";
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-elev">
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${bg}`}>{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}
