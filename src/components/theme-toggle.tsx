import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "bms.theme";
type Theme = "light" | "dark";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Instant day / night switch. Remembers the choice on this device. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    apply(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    apply(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
      title={theme === "dark" ? "Day mode" : "Night mode"}
      className={`grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/10 transition-all duration-300 hover:scale-110 hover:bg-primary-foreground/25 ${className}`}
    >
      {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
    </button>
  );
}
