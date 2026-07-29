import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, Users, FileText, Waves, Megaphone } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | Bhoiraj Matsya Sanstha" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive/70" />
        <div className="mt-3 font-semibold">Administrators only</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage members, documents, audits and announcements.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminCard to="/members" icon={<Users className="h-5 w-5" />} title="Member Records" desc="Search, add and edit member profiles." />
        <AdminCard to="/documents" icon={<FileText className="h-5 w-5" />} title="Documents" desc="Upload and organize the document vault." />
        <AdminCard to="/audits" icon={<Waves className="h-5 w-5" />} title="Dam Audits" desc="Record yearly audit costs and findings." />
        <AdminCard to="/announcements" icon={<Megaphone className="h-5 w-5" />} title="Announcements" desc="Publish notices to members and public." />
      </div>
      <div className="rounded-2xl border border-saffron/40 bg-saffron/5 p-5 text-sm">
        <div className="font-semibold text-saffron">Note</div>
        <p className="mt-1 text-muted-foreground">
          Detailed admin forms (member registration, document upload, audit entry) will be built next. The infrastructure and secure database policies are already in place.
        </p>
      </div>
    </div>
  );
}

function AdminCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-elev">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-saffron/15 text-saffron">{icon}</div>
      <div className="mt-4 font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}
