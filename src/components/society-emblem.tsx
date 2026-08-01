/** Custom emblem for the society — an original mark, not a government emblem. */
export function SocietyEmblem({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Bhoiraj Matsya Sanstha emblem">
      <defs>
        <linearGradient id="emb-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.1 255)" />
          <stop offset="100%" stopColor="oklch(0.28 0.08 255)" />
        </linearGradient>
        <linearGradient id="emb-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.11 200)" />
          <stop offset="100%" stopColor="oklch(0.45 0.1 220)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#emb-ring)" />
      <circle cx="50" cy="50" r="41" fill="oklch(0.98 0.01 240)" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="oklch(0.66 0.17 52)" strokeWidth="2" />
      {/* Water */}
      <path d="M12 62c8 0 8-5 16-5s8 5 16 5 8-5 16-5 8 5 16 5 8-5 12-5v26H12z" fill="url(#emb-water)" opacity="0.85" />
      {/* Fish */}
      <g transform="translate(50 44)">
        <path
          d="M-20 0c6-11 20-14 28-7 3-4 8-6 12-6-2 5-2 9 0 13-2 4-2 8 0 13-4 0-9-2-12-6-8 7-22 4-28-7z"
          fill="oklch(0.34 0.09 255)"
        />
        <circle cx="-8" cy="-2" r="2" fill="oklch(0.98 0.01 240)" />
      </g>
      {/* Wheat / prosperity sprigs */}
      <path d="M22 78c4-8 6-16 6-24" stroke="oklch(0.66 0.17 52)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M78 78c-4-8-6-16-6-24" stroke="oklch(0.66 0.17 52)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text
        x="50"
        y="24"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="oklch(0.34 0.09 255)"
        fontFamily="serif"
      >
        BMS
      </text>
    </svg>
  );
}
