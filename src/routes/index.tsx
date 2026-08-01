import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { FaqSection } from "@/components/faq-section";
import { GrievanceForm } from "@/components/grievance-form";
import { SocietyEmblem } from "@/components/society-emblem";
import { SITE, SLOGANS, AIM, OBJECTIVES, ROADMAP, SCHEME_CARDS } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, FileText, Users, Waves, Bot, ShieldCheck, Sparkles, Target, ListChecks, Award, Megaphone } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bhoiraj Matsya Sanstha, Pimpalgaon Bk. | Fisheries Co-operative Portal" },
      {
        name: "description",
        content:
          "Official portal of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. — member registration, dam audit reports, government fisheries schemes and grievance redressal.",
      },
      { property: "og:title", content: "Bhoiraj Matsya Sanstha, Pimpalgaon Bk. — Fisheries Co-operative Portal" },
      {
        property: "og:description",
        content: "Member registry, dam audits, PMMSY scheme guidance and a multilingual AI assistant for the fishermen of Pimpri – Dambhurni – Ghodasgaon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Snapshot = { members: number; documents: number; audits: number; achievements: number; dams: number; schemes: number };

function Home() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

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

  // Live figures for the Digital Society Snapshot — refreshed automatically.
  const { data: snap } = useQuery<Snapshot>({
    queryKey: ["society-snapshot"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("society_snapshot");
      return (data ?? { members: 0, documents: 0, audits: 0, achievements: 0, dams: 0, schemes: 0 }) as Snapshot;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NoticeBar items={announcements.map((a) => `${a.title} — ${a.body ?? ""}`)} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{ background: "radial-gradient(1200px 520px at 88% -12%, oklch(0.85 0.15 200) 0%, transparent 62%)" }}
        />
        <div aria-hidden className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-saffron/20 blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> {t("hero.badge")}
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-balance md:text-5xl">
              {t("hero.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 md:text-lg">
              {t("hero.subtitle")}
            </p>
            <p className="mt-3 text-sm italic text-accent">{SITE.tagline[lang]}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-saffron px-5 py-3 text-sm font-bold text-saffron-foreground shadow-elev transition hover:brightness-95"
                >
                  Open my portal <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-saffron px-5 py-3 text-sm font-bold text-saffron-foreground shadow-elev transition hover:brightness-95"
                  >
                    New Member Registration <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/auth"
                    search={{ profile: undefined, redirect: "/dashboard" }}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-primary-foreground/20"
                  >
                    Click here to Login
                  </Link>
                </>
              )}
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-primary-foreground/60">Reg. No.</dt><dd className="font-mono font-semibold">{SITE.regNo}</dd></div>
              <div><dt className="text-primary-foreground/60">Established</dt><dd className="font-semibold">2004</dd></div>
              <div><dt className="text-primary-foreground/60">District</dt><dd className="font-semibold">Jalgaon</dd></div>
            </dl>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-primary-foreground/15 bg-primary-foreground/[0.07] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
                <Sparkles className="h-3.5 w-3.5" /> Digital Society Snapshot
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCard label="Members" value={snap?.members} />
                <StatCard label="Documents" value={snap?.documents} />
                <StatCard label="Dam Audits" value={snap?.audits} />
                <StatCard label="Achievements" value={snap?.achievements} />
                <StatCard label="Lakes & Dams" value={snap?.dams} />
                <StatCard label="Schemes" value={snap?.schemes} />
              </div>
              <div className="mt-5 rounded-2xl border border-primary-foreground/10 bg-primary/40 p-4 text-sm">
                <div className="font-semibold">Chairman</div>
                <div className="mt-1 text-primary-foreground/80">{SITE.chairman}</div>
                <div className="mt-2 text-xs text-primary-foreground/60">{SITE.chairmanPhone}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SloganBand />

      {/* SLIDESHOW */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading
          eyebrow="Gallery"
          title="Our society in action"
          sub="Photographs published by the Chairman — ponds, harvests, meetings and scheme camps."
        />
        <div className="mt-8">
          <HeroSlideshow />
        </div>
      </section>

      {/* AIM */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur md:p-12">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-3">
              <SocietyEmblem className="h-20 w-20" />
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Target className="h-3.5 w-3.5" /> Aim
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold md:text-3xl">Our Aim</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{AIM}</p>
            </div>
          </div>
        </div>
      </section>

      {/* OBJECTIVES */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <SectionHeading
          eyebrow={<><ListChecks className="h-3.5 w-3.5" /> Objectives</>}
          title="Aims & Objectives of the Society"
          sub="Six commitments that guide every decision taken by the managing committee."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o, i) => (
            <div
              key={o.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elev"
            >
              <div aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition group-hover:bg-saffron/15" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-hero-gradient font-display text-sm font-bold text-primary-foreground shadow-elev">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="min-w-0 font-display text-lg font-semibold">{o.title}</h3>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEMES */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <SectionHeading eyebrow="Benefits" title="Fisheries Schemes for our Members" sub="Tap any scheme to read the eligibility and how the society helps you apply." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SCHEME_CARDS.map((s) => (
            <Link
              key={s.title}
              to="/schemes"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-elev"
            >
              <div className={`h-1.5 w-14 rounded-full ${toneBar(s.tone)}`} />
              <div className="mt-4 font-display text-lg font-bold">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                Click here <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <AchievementsPreview />

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionHeading title={t("features.title")} sub="Every workflow of the cooperative — from member records to dam audits — in one secure portal." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Users className="h-5 w-5" />} title={t("f1.title")} body={t("f1.body")} accent="teal" />
          <FeatureCard icon={<FileText className="h-5 w-5" />} title={t("f2.title")} body={t("f2.body")} accent="saffron" />
          <FeatureCard icon={<Waves className="h-5 w-5" />} title={t("f3.title")} body={t("f3.body")} accent="accent" />
          <FeatureCard icon={<Bot className="h-5 w-5" />} title={t("f4.title")} body={t("f4.body")} accent="primary" />
        </div>
      </section>

      {/* CTA + ROADMAP — hidden once the visitor is signed in */}
      {!user && (
        <>
          <section className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 text-primary-foreground shadow-elev md:p-16">
              <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-saffron/25 blur-[90px]" />
              <h3 className="relative font-display text-3xl font-bold md:text-4xl">
                Register or access your member portal today
              </h3>
              <p className="relative mt-3 max-w-2xl text-primary-foreground/85">
                Members can upload documents, view dam audit reports, chat with the AI assistant, and stay updated with
                government scheme benefits.
              </p>
              <div className="relative mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-saffron px-6 py-3 font-bold text-saffron-foreground shadow-elev hover:brightness-95">
                  Register now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth"
                  search={{ profile: undefined, redirect: "/dashboard" }}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3 font-semibold backdrop-blur hover:bg-primary-foreground/20"
                >
                  Login
                </Link>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-20">
            <SectionHeading eyebrow="Roadmap" title="How to Register?" sub="Eight simple steps — the whole process takes about five minutes." />
            <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP.map((r) => (
                <li
                  key={r.step}
                  className="relative rounded-2xl border border-border bg-card/80 p-6 backdrop-blur transition hover:-translate-y-1 hover:shadow-elev"
                >
                  <span className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-saffron font-display text-sm font-bold text-saffron-foreground shadow-elev">
                    {r.step}
                  </span>
                  <div className="mt-3 font-display font-semibold">{r.title}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-elev hover:bg-primary/90">
                Start my registration <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </>
      )}

      <FaqSection />
      <GrievanceForm />
      <SiteFooter />
    </div>
  );
}

function toneBar(tone: string) {
  return tone === "saffron" ? "bg-saffron" : tone === "teal" ? "bg-teal" : tone === "accent" ? "bg-accent" : "bg-primary";
}

function NoticeBar({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-2 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-saffron px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-saffron-foreground">
          <Megaphone className="h-3 w-3" /> Notice
        </span>
        <div className="relative min-w-0 overflow-hidden">
          <div className="marquee-track flex gap-12 whitespace-nowrap">
            {[...items, ...items].map((s, i) => (
              <span key={i} className="text-secondary-foreground/90">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SloganBand() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % SLOGANS.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="border-y border-border bg-wave-gradient">
      <div className="mx-auto max-w-7xl px-4 py-5 text-center">
        <p key={i} className="font-display text-base font-semibold text-primary md:text-xl">
          “{SLOGANS[i]}”
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-primary/30 p-4">
      <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

function FeatureCard({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent: string }) {
  const bg =
    accent === "saffron" ? "bg-saffron/15 text-saffron"
      : accent === "teal" ? "bg-teal/15 text-teal"
      : accent === "accent" ? "bg-accent/20 text-accent-foreground"
      : "bg-primary/10 text-primary";
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-elev">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${bg}`}>{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function AchievementsPreview() {
  const { data = [] } = useQuery({
    queryKey: ["achievements-preview"],
    queryFn: async () =>
      (await supabase.from("achievements").select("id,title,summary,image_url").eq("is_published", true).limit(3)).data ?? [],
  });
  return (
    <section className="mx-auto max-w-7xl px-4 pt-20">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron">
            <Award className="h-3.5 w-3.5" /> Achievements
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold">What our society has achieved</h2>
        </div>
        <Link to="/achievements" className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          View all
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Achievements published by the Chairman will appear here.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.map((a) => (
            <Link
              key={a.id}
              to="/achievements"
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-elev"
            >
              {a.image_url && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={a.image_url} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
              )}
              <div className="p-5">
                <div className="font-display text-lg font-semibold">{a.title}</div>
                {a.summary && <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
