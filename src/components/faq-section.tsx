import { useState } from "react";
import { FAQS } from "@/lib/site";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20">
      <div className="text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-teal/15 text-teal">
          <HelpCircle className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Answers for members, the Chairman and visitors. Still stuck? Use the grievance form below.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={`overflow-hidden rounded-2xl border bg-card/80 backdrop-blur transition ${
                isOpen ? "border-primary/40 shadow-elev" : "border-border"
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left"
              >
                <span className="min-w-0 font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {f.q}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
