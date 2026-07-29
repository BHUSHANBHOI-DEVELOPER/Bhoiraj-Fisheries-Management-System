import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements | Bhoiraj Matsya Sanstha" }] }),
  component: Announcements,
});

function Announcements() {
  const { data = [] } = useQuery({
    queryKey: ["announcements-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground">Latest notices from the society.</p>
      </div>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <div className="mt-3 font-medium">No announcements yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-saffron" />
                <div className="font-semibold">{a.title}</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(a.published_at ?? a.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
