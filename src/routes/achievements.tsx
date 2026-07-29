import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Milestones, awards and achievements of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { property: "og:title", content: "Achievements" },
      { property: "og:description", content: "Milestones and awards of the fisheries cooperative society since 2004." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["achievements-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_published", true)
        .order("achieved_on", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Achievements</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Milestones, awards and proud moments of the society — visible to everyone.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No achievements published yet</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((a) => (
              <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {a.image_url && <img src={a.image_url} alt={a.title} loading="lazy" className="h-48 w-full object-cover" />}
                <div className="p-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-saffron">
                    <Trophy className="h-3 w-3" /> Achievement
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold">{a.title}</h2>
                  {a.achieved_on && (
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(a.achieved_on).toLocaleDateString()}</div>
                  )}
                  {a.summary && <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>}
                  {a.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{a.body}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
