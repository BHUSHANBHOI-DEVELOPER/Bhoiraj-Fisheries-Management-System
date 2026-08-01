import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

/**
 * Automatic slideshow of the promotional photos uploaded by the Chairman.
 * Uses a blurred copy of the current photo behind the frame for depth.
 */
export function HeroSlideshow() {
  const { data = [] } = useQuery({
    queryKey: ["promos-public"],
    queryFn: async () =>
      (await supabase.from("promo_images").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const [i, setI] = useState(0);

  useEffect(() => {
    if (data.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % data.length), 5000);
    return () => clearInterval(id);
  }, [data.length]);

  if (data.length === 0) {
    return (
      <div className="grid h-72 place-items-center rounded-3xl border border-dashed border-border bg-card/60 text-center backdrop-blur">
        <div>
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Photos uploaded by the Chairman will play here as an automatic slideshow.
          </p>
        </div>
      </div>
    );
  }

  const current = data[Math.min(i, data.length - 1)];
  const go = (d: number) => setI((v) => (v + d + data.length) % data.length);

  return (
    <div className="relative">
      {/* Blurred bloom behind the frame */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-cover bg-center opacity-40 blur-2xl saturate-150"
        style={{ backgroundImage: `url(${current.image_url})` }}
      />
      <figure className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elev">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {data.map((p, idx) => (
            <img
              key={p.id}
              src={p.image_url}
              alt={p.title ?? "Society activity photograph"}
              loading={idx === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
            {current.title && (
              <div className="font-display text-lg font-bold text-white drop-shadow">{current.title}</div>
            )}
            {current.caption && <div className="mt-0.5 text-sm text-white/80">{current.caption}</div>}
          </div>
        </div>

        {data.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </figure>

      {data.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {data.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setI(idx)}
              aria-label={`Photo ${idx + 1}`}
              className={`h-12 w-16 overflow-hidden rounded-lg border-2 transition ${
                idx === i ? "border-saffron opacity-100" : "border-transparent opacity-60 blur-[1px] hover:opacity-90 hover:blur-0"
              }`}
            >
              <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
