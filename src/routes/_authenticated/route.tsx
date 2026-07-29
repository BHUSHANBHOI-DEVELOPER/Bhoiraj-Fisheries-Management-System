import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { LayoutDashboard, Users, FileText, Waves, Bot, Megaphone, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

function Layout() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/documents", icon: FileText, label: t("nav.documents") },
    { to: "/audits", icon: Waves, label: "Dam Audits" },
    { to: "/chat", icon: Bot, label: t("nav.chat") },
    { to: "/notifications", icon: Megaphone, label: "Notifications" },
    { to: "/announcements", icon: Megaphone, label: "Announcements" },

  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 transition hover:bg-muted"
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</div>
                <Link to="/members" activeProps={{ className: "bg-saffron text-saffron-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                  <Users className="h-4 w-4" /> Members
                </Link>
                <Link to="/admin" activeProps={{ className: "bg-saffron text-saffron-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                  <ShieldAlert className="h-4 w-4" /> Admin Panel
                </Link>
              </>
            )}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
