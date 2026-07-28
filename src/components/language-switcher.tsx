import { useI18n, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";

const options: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "mr", label: "मरा" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-1 py-0.5 text-xs">
      <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      {options.map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={`rounded-full px-2 py-0.5 transition ${
            lang === o.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
