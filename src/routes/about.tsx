import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { name: "description", content: "About Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. — registered in 2004, serving fishermen across Pimpri, Dambhurni and Ghodasgaon." },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-foreground">{t("society.title")}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("society.body")}</p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">Society Details</h2>
          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            <Row label="Name" value={SITE.name} />
            <Row label="Registration No." value={SITE.regNo} />
            <Row label="Established" value={SITE.establishedOn} />
            <Row label="Chairman" value={SITE.chairman} />
            <Row label="Address" value={SITE.address} />
            <Row label="Operating Area" value={SITE.area} />
            <Row label="Phone" value={SITE.chairmanPhone} />
            <Row label="Email" value={SITE.chairmanEmail} />
          </dl>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-secondary p-6">
          <h3 className="font-display text-lg font-semibold">Certificate of Registration</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Registered under Section 9(1) of the Maharashtra Cooperative Societies Act, 1960 (Maharashtra Act No. XXIV of 1961).
            Classified under Section 12(1) of the said Act and Rule 10(1) of the Maharashtra Cooperative Societies Rules, 1961.
            Registered at Jalgaon on 23/06/2004.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
