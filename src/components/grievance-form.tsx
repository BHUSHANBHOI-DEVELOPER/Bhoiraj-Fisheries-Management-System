import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquareWarning, Send } from "lucide-react";

const CATEGORIES = [
  "Membership / registration",
  "Dam & water allotment",
  "Government scheme benefit",
  "Documents / audit report",
  "Payment or dues",
  "Portal / technical problem",
  "Other",
];

export function GrievanceForm() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    category: CATEGORIES[0],
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 3) return toast.error("Please enter your full name.");
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "")) && !form.email.includes("@"))
      return toast.error("Enter a 10-digit mobile number or an email address so we can reply.");
    if (form.subject.trim().length < 3) return toast.error("Please enter a subject.");
    if (form.message.trim().length < 10) return toast.error("Please describe your grievance in a little more detail.");

    setBusy(true);
    try {
      const { error } = await supabase.from("grievances").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.replace(/\D/g, "") || null,
        email: form.email.trim().toLowerCase() || null,
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      if (error) throw error;
      toast.success("Your grievance has been recorded and sent to the Chairman.");
      setForm({ full_name: "", phone: "", email: "", category: CATEGORIES[0], subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit the grievance");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-input bg-background/80 px-3 py-2.5 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <section id="grievance" className="mx-auto max-w-3xl px-4 pb-24">
      <div className="relative">
        <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-saffron/10 blur-3xl" />
        <div className="relative rounded-3xl border border-border bg-card/85 p-7 shadow-elev backdrop-blur-xl md:p-10">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-saffron/15 text-saffron">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold md:text-3xl">Grievance Form</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Raise a complaint or request directly with the Chairman. Every submission is recorded with a timestamp.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Full name *</label>
                <input value={form.full_name} onChange={set("full_name")} className={field} placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs font-semibold">Mobile number</label>
                <input value={form.phone} onChange={set("phone")} inputMode="numeric" className={field} placeholder="10-digit mobile" />
              </div>
              <div>
                <label className="text-xs font-semibold">Email</label>
                <input value={form.email} onChange={set("email")} type="email" className={field} placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-xs font-semibold">Category *</label>
                <select value={form.category} onChange={set("category")} className={field}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Subject *</label>
              <input value={form.subject} onChange={set("subject")} className={field} placeholder="In one line" />
            </div>
            <div>
              <label className="text-xs font-semibold">Your grievance *</label>
              <textarea value={form.message} onChange={set("message")} rows={5} className={field} placeholder="Describe the issue..." />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-6 py-3 text-sm font-bold text-saffron-foreground shadow-elev transition hover:brightness-95 disabled:opacity-50 sm:w-auto"
            >
              <Send className="h-4 w-4" /> {busy ? "Submitting..." : "Submit grievance"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
