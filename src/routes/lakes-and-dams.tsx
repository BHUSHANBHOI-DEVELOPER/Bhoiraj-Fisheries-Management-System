import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Waves, Newspaper } from "lucide-react";

export const Route = createFileRoute("/lakes-and-dams")({
  head: () => ({
    meta: [
      { title: "Lakes & Dams | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Photos, details and latest news of the lakes and dams managed by Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { property: "og:title", content: "Lakes & Dams" },
      { property: "og:description", content: "Water bodies, capacity, photos and news of the society's fisheries dams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LakesAndDams,
});

function LakesAndDams() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["dams-public"],
    queryFn: async () => {
      const { data } = await supabase.from("dams").select("*").eq("is_published", true).order("name");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Lakes & Dams</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Water bodies under the society — photos, capacity, and the latest news uploaded by the Chairman.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No dam information published yet</div>
            <p className="mt-1 text-sm text-muted-foreground">The Chairman can add dams, photos and news from the Admin Panel.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((d) => (
              <article key={d.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-elev">
                {d.image_url ? (
                  <img src={d.image_url} alt={`${d.name} dam`} loading="lazy" className="h-48 w-full object-cover" />
                ) : (
                  <div className="grid h-48 w-full place-items-center bg-wave-gradient text-primary/40">
                    <Waves className="h-10 w-10" />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold">{d.name}</h2>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[d.village, d.taluka, d.district].filter(Boolean).join(", ")}
                  </div>
                  {d.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.description}</p>}
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {d.water_area && (
                      <div className="rounded-lg border border-border px-3 py-2">
                        <dt className="text-muted-foreground">Water area</dt>
                        <dd className="font-medium">{d.water_area}</dd>
                      </div>
                    )}
                    {d.capacity && (
                      <div className="rounded-lg border border-border px-3 py-2">
                        <dt className="text-muted-foreground">Capacity</dt>
                        <dd className="font-medium">{d.capacity}</dd>
                      </div>
                    )}
                  </dl>
                  {d.latest_news && (
                    <div className="mt-4 flex gap-2 rounded-lg bg-saffron/10 p-3 text-xs text-foreground/80">
                      <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
                      <span>{d.latest_news}</span>
                    </div>
                  )}
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
