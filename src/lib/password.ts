/** Password helpers: memorable-but-strong generation + a simple strength score. */

const WORDS = [
  "Sagar", "Matsya", "Nadi", "Kolambi", "Rohu", "Katla", "Jalgaon", "Pimpal",
  "Godavari", "Mahseer", "Anchor", "Harbour", "Trawler", "Monsoon", "Delta",
  "Lagoon", "Coral", "Tilapia", "Prawn", "Estuary", "Beacon", "Current",
];

const SYMBOLS = "!@#$%&*?";

function pick<T>(arr: readonly T[] | string): T | string {
  const idx = Math.floor((globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Math.random() * 2 ** 32) / 2 ** 32 * arr.length);
  return (arr as readonly T[])[Math.min(idx, arr.length - 1)];
}

/**
 * Generates a strong yet memorable passphrase, e.g. `Sagar-Trawler47!`.
 * Long and random enough that it will not appear in any leaked-password list.
 */
export function generatePassword(name?: string): string {
  const cleanName = name?.trim().split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "");
  const a = cleanName && cleanName.length >= 3 ? `${cleanName[0].toUpperCase()}${cleanName.slice(1).toLowerCase()}` : pick(WORDS) as string;
  let b = pick(WORDS) as string;
  while (b === a) b = pick(WORDS) as string;
  const nums = String(10 + Math.floor(Math.random() * 89));
  const sym = pick(SYMBOLS) as string;
  return `${a}-${b}${nums}${sym}`;
}

export type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: "bg-destructive" | "bg-saffron" | "bg-teal" | "bg-primary";
  hints: string[];
};

/** Rates a password for the on-screen strength meter. */
export function ratePassword(pw: string): Strength {
  const hints: string[] = [];
  let score = 0;
  if (pw.length >= 9) score++; else hints.push("Use more than 8 characters");
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++; else hints.push("Mix capital and small letters");
  if (/[0-9]/.test(pw)) score++; else hints.push("Add a number");
  if (/[^A-Za-z0-9]/.test(pw)) score++; else hints.push("Add a symbol like ! or @");

  const common = /^(password|123456|qwerty|admin|welcome|abc123|iloveyou|letmein)/i.test(pw);
  if (common) {
    hints.unshift("This is a commonly leaked password — it will be rejected");
    score = 0;
  }

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
  const tones = ["bg-destructive", "bg-destructive", "bg-saffron", "bg-teal", "bg-primary"] as const;
  return { score: clamped, label: labels[clamped], tone: tones[clamped], hints };
}
