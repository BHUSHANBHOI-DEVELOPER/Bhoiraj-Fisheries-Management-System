import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Fish, HandCoins, GraduationCap, ShieldCheck, TrendingUp, Search } from "lucide-react";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Schemes | Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { name: "description", content: "Government schemes supporting fisheries members — PM-MKSSY components including credit facilitation, aquaculture insurance, performance grants, and training." },
    ],
  }),
  component: Schemes,
});

const items = [
  { icon: <CreditCard />, title: "Credit Facilitation", body: "Institutional credit for pond development, gear and working capital." },
  { icon: <Fish />, title: "Aquaculture Insurance", body: "Crop insurance for fisheries risk mitigation." },
  { icon: <HandCoins />, title: "Performance Grant", body: "Incentives based on production and value-chain performance." },
  { icon: <ShieldCheck />, title: "Strengthening of Cooperatives", body: "Institutional support for cooperative capacity and governance." },
  { icon: <Search />, title: "Traceability", body: "Track catch and produce from origin to consumer." },
  { icon: <GraduationCap />, title: "Training & Capacity Building", body: "Skill development for members and cooperative staff." },
  { icon: <TrendingUp />, title: "Market Linkages", body: "e-auction, e-commerce and B2B marketplace access." },
];

function Schemes() {
  const { data: custom = [] } = useQuery({
    queryKey: ["schemes-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("schemes")
        .select("*")
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">PM-MKSSY: Benefits for Members</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Registration with the society is mandatory to avail benefits under various components of PM-MKSSY.
          Sign in to your member portal to apply.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-elev">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{it.icon}</div>
              <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>

        {custom.length > 0 && (
          <>
            <h2 className="mt-16 font-display text-2xl font-bold">Schemes announced by the society</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {custom.map((s) => (
                <article key={s.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {s.image_url && <img src={s.image_url} alt={s.title} loading="lazy" className="h-40 w-full object-cover" />}
                  <div className="p-6">
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    {s.summary && <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>}
                    {s.body && <p className="mt-3 whitespace-pre-line text-sm text-foreground/80">{s.body}</p>}
                    {s.external_url && (
                      <a href={s.external_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                        Read more →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

