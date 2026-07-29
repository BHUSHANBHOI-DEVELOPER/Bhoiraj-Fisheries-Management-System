import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Bhoiraj Matsya Sanstha" },
      { name: "description", content: "Personal and society-wide notifications for members of Bhoiraj Matsya Sanstha." },
      { property: "og:title", content: "Notifications" },
      { property: "og:description", content: "Updates sent to you by the Chairman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Updates sent to you personally and to all members.</p>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <div className="mt-3 font-medium">No notifications yet</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((n) => (
            <li key={n.id} className={`rounded-2xl border p-5 ${n.read_at ? "border-border bg-card" : "border-saffron/40 bg-saffron/5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {n.is_broadcast ? "All members" : "Personal"} • {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                {!n.read_at && n.recipient_id === user?.id && (
                  <button onClick={() => markRead(n.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                    <Check className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
