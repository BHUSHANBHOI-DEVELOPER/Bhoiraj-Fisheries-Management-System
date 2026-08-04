import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { editMember, deleteMemberPermanently } from "@/lib/admin-members.functions";
import { exportMembersDoc, exportMembersExcel, exportMembersPdf, type ExportMember } from "@/lib/member-exports";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members | Bhoiraj Matsya Sanstha" }] }),
  component: Members,
});

function Members() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const updateMember = useServerFn(editMember);
  const hardDelete = useServerFn(deleteMemberPermanently);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("members")
        .select("id,full_name,phone,email,village,membership_number,join_date,status")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive/70" />
        <div className="mt-3 font-semibold">Administrators only</div>
        <p className="mt-1 text-sm text-muted-foreground">Member records contain personal information and are restricted.</p>
      </div>
    );
  }

  const filtered = data.filter((m) =>
    !q.trim() ||
    m.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    m.phone?.includes(q) ||
    m.membership_number?.toLowerCase().includes(q.toLowerCase())
  );
  const exportRows: ExportMember[] = filtered.map((m) => ({
    membership_number: m.membership_number ?? "", full_name: m.full_name, phone: m.phone ?? "",
    email: m.email ?? "", village: m.village ?? "", status: m.status, join_date: m.join_date ?? "",
  }));

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMember({ data: { memberId: editing.id, fullName: editing.full_name, phone: editing.phone, email: editing.email ?? "", village: editing.village ?? "", status: editing.status } });
      toast.success("Member record updated."); setEditing(null); await refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Update failed"); }
  }

  async function removeMember(member: (typeof data)[number]) {
    const confirmation = window.prompt(`Permanently delete ${member.full_name} and their login account? Type DELETE to continue.`);
    if (confirmation !== "DELETE") return;
    try {
      await hardDelete({ data: { memberId: member.id, confirmation } });
      toast.success("Member and login account permanently deleted."); await refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Delete failed"); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">Search and manage cooperative members.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or membership number..." className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={() => exportMembersExcel(exportRows)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
        <button onClick={() => exportMembersPdf(exportRows)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold"><FileText className="h-4 w-4" /> PDF</button>
        <button onClick={() => exportMembersDoc(exportRows)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold"><Download className="h-4 w-4" /> Word</button>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No members yet</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Membership #</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">{m.membership_number ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{m.full_name}</td>
                  <td className="px-4 py-3">{m.phone ?? "—"}</td>
                  <td className="px-4 py-3">{m.village ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.join_date ? new Date(m.join_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button onClick={() => setEditing({ ...m })} aria-label="Edit member" className="rounded p-2 text-primary hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => removeMember(m)} aria-label="Permanently delete member" className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"><form onSubmit={saveEdit} className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Edit member</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[["Full name", "full_name"], ["Mobile", "phone"], ["Email", "email"], ["Village", "village"]].map(([label, key]) => <label key={key} className="text-xs font-medium">{label}<input value={editing[key] ?? ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>)}
          <label className="text-xs font-medium">Status<select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save changes</button>
      </form></div>}
    </div>
  );
}
