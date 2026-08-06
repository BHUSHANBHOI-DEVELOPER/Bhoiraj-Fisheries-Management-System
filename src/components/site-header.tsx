import { Link } from "@tanstack/react-router";
import { Menu, X, Facebook, Instagram, Youtube, Twitter, Globe } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { SocietyEmblem } from "./society-emblem";
import { SITE } from "@/lib/site";

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  x: Twitter,
  website: Globe,
};

export function SiteHeader() {
  const { t } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Social icons appear only once the Chairman has added a link.
  const { data: links = [] } = useQuery({
    queryKey: ["site-links"],
    queryFn: async () =>
      (await supabase.from("site_links").select("platform,url").eq("is_active", true)).data ?? [],
  });

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/lakes-and-dams", label: "Lakes & Dams" },
    { to: "/registered-members", label: "Members" },
    { to: "/achievements", label: "Achievements" },
    { to: "/schemes", label: t("nav.schemes") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      {/* Top utility strip */}
      <div className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-1.5 text-[11px]">
          <span className="truncate text-primary-foreground/80">
            Reg. No. {SITE.regNo} · Est. {SITE.establishedOn} · Dist. Jalgaon, Maharashtra
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {links.map((l) => {
              const Icon = SOCIAL_ICONS[l.platform.toLowerCase()] ?? Globe;
              return (
                <a
                  key={l.platform + l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={l.platform}
                  className="grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/10 transition hover:bg-primary-foreground/25"
                >
                  <Icon className="h-3 w-3" />
                </a>
              );
            })}
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Centered branding band */}
      <div className="relative overflow-hidden bg-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: "radial-gradient(900px 300px at 50% 120%, oklch(0.45 0.12 220), transparent 70%)" }}
        />
        <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/" aria-label="Home" className="shrink-0">
            <SocietyEmblem className="h-14 w-14 drop-shadow-sm md:h-16 md:w-16" />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="font-display text-base font-extrabold leading-tight tracking-tight text-primary sm:text-xl md:text-[26px]">
              {SITE.name}
            </h1>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
              Fisheries Co-operative Society · मत्स्य व्यवसाय सहकारी संस्था
            </p>
          </div>

          {/* PMMSY mark — clicks through to the schemes section */}
          <Link
            to="/schemes"
            aria-label="PMMSY schemes"
            className="hidden shrink-0 flex-col items-center rounded-xl border border-border bg-background/70 px-3 py-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-elev sm:flex"
          >
            <span className="font-display text-sm font-extrabold text-saffron">PMMSY</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
              Matsya Sampada
            </span>
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="shrink-0 rounded-md border border-border p-2 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Advanced menu bar */}
      <div className="hidden bg-hero-gradient text-primary-foreground shadow-elev md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeProps={{ className: "bg-primary-foreground/15 text-accent" }}
                className="relative px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-primary-foreground/85 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 py-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-md bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold hover:bg-primary-foreground/25"
                >
                  {t("nav.dashboard")}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-md bg-saffron px-3 py-1.5 text-xs font-semibold text-saffron-foreground hover:brightness-95"
                  >
                    {t("nav.admin")}
                  </Link>
                )}
                <button
                  onClick={() => void signOut()}
                  className="rounded-md border border-primary-foreground/30 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/10"
                >
                  {t("nav.signout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-md bg-saffron px-3 py-1.5 text-xs font-bold text-saffron-foreground hover:brightness-95"
                >
                  Register
                </Link>
                <Link
                  to="/auth"
                  search={{ profile: undefined, redirect: "/dashboard" }}
                  className="rounded-md bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold hover:bg-primary-foreground/25"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {t("nav.dashboard")}
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md bg-saffron px-3 py-2 text-sm text-saffron-foreground">
                    {t("nav.admin")}
                  </Link>
                )}
                <Link to="/account" onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-2 text-sm">
                  My Login &amp; Security
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="rounded-md border border-border px-3 py-2 text-left text-sm font-medium"
                >
                  {t("nav.signout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-md bg-saffron px-3 py-2 text-sm font-semibold text-saffron-foreground">
                  Register (new member)
                </Link>
                <Link
                  to="/auth"
                  search={{ profile: undefined, redirect: "/dashboard" }}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
