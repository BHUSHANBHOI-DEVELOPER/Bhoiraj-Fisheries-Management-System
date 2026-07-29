import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { Mail, MapPin, Phone, User } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk." },
      { name: "description", content: "Contact the chairman and office of Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk., Pimpalgaon Bk., Taluka Pachora, Jalgaon." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">In Case of Any Query & Feedback</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card icon={<User className="h-5 w-5" />} label="Chairman" value={SITE.chairman} />
          <Card icon={<Phone className="h-5 w-5" />} label="Toll / Direct" value={SITE.chairmanPhone} href={`tel:${SITE.chairmanPhone}`} />
          <Card icon={<Mail className="h-5 w-5" />} label="Email" value={SITE.chairmanEmail} href={`mailto:${SITE.chairmanEmail}`} />
          <Card icon={<MapPin className="h-5 w-5" />} label="Office" value={SITE.address} />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Card({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-elev">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
