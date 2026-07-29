import { Link } from "@tanstack/react-router";
import { Fish, Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "./language-switcher";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-hero-gradient text-primary-foreground shadow-elev">
            <Fish className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-foreground">{SITE.shortName}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coop. Society • Est. 2004</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-primary font-semibold" }}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:inline-flex"
              >
                {t("nav.dashboard")}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden text-xs font-medium text-saffron md:inline">
                  {t("nav.admin")}
                </Link>
              )}
              <button
                onClick={signOut}
                className="hidden rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted md:inline-flex"
              >
                {t("nav.signout")}
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:inline-flex"
            >
              {t("nav.signin")}
            </Link>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-md border border-border p-1.5 md:hidden">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
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
              <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                {t("nav.dashboard")}
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                {t("nav.signin")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
