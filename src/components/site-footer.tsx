import { SITE } from "@/lib/site";
import { Mail, Phone, MapPin, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocietyEmblem } from "./society-emblem";

/** Counts one visit per browser session and shows the running total. */
function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const already = sessionStorage.getItem("bms-visit-counted") === "1";
      if (already) {
        const { data } = await supabase.from("visitor_counter").select("total").eq("id", 1).maybeSingle();
        if (!cancelled) setTotal(data?.total ?? null);
        return;
      }
      const { data, error } = await supabase.rpc("bump_visitor_counter");
      if (!error) sessionStorage.setItem("bms-visit-counted", "1");
      if (!cancelled) setTotal(typeof data === "number" ? data : null);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 backdrop-blur">
      <Eye className="h-4 w-4 text-accent" />
      <span className="text-xs uppercase tracking-wider text-primary-foreground/70">Visitor No:</span>
      <span className="font-mono text-sm font-bold tabular-nums text-primary-foreground">
        {total === null ? "—" : total.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-start gap-3">
            <SocietyEmblem className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold leading-snug">{SITE.name}</div>
              <p className="mt-2 text-sm text-primary-foreground/70">
                Reg. No. {SITE.regNo} · Est. {SITE.establishedOn}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/70">Area: {SITE.area}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {SITE.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-accent" /> {SITE.chairmanPhone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-accent" /> {SITE.chairmanEmail}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold">Quick links</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-primary-foreground/80">
            <li><Link to="/schemes" className="hover:text-accent">Government schemes</Link></li>
            <li><Link to="/registered-members" className="hover:text-accent">Registered members</Link></li>
            <li><Link to="/lakes-and-dams" className="hover:text-accent">Lakes &amp; dams</Link></li>
            <li><Link to="/achievements" className="hover:text-accent">Achievements</Link></li>
            <li><Link to="/register" className="hover:text-accent">New registration</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact &amp; grievance</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4">
          <p className="min-w-0 text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} {SITE.shortName}. All rights reserved.
          </p>
          <VisitorCounter />
        </div>
      </div>
    </footer>
  );
}
