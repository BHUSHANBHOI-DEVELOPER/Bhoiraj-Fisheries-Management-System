import { SITE } from "@/lib/site";
import { Fish, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Fish className="h-5 w-5 text-accent" />
            <div className="font-display font-semibold">{SITE.name}</div>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">
            Reg. No. {SITE.regNo} · Est. {SITE.establishedOn}
          </p>
          <p className="mt-2 text-sm text-primary-foreground/70">Area: {SITE.area}</p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-accent" /> {SITE.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> {SITE.chairmanPhone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> {SITE.chairmanEmail}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold">Chairman</h4>
          <p className="mt-3 text-sm text-primary-foreground/80">{SITE.chairman}</p>
          <p className="mt-2 text-xs text-primary-foreground/60">
            A registered cooperative society under the Maharashtra Cooperative Societies Act, 1961.
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-4 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
