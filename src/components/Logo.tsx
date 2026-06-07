export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" aria-label="Invoyca">
      <rect x="62" y="50" width="14" height="100" rx="7" fill="#0F172A" />
      <defs>
        <linearGradient id="ivGrad" x1="92" y1="78" x2="135" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <path d="M93 78 L114 150" stroke="#0F172A" strokeWidth="9" strokeLinecap="round" />
      <path d="M135 78 L116 150" stroke="url(#ivGrad)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
