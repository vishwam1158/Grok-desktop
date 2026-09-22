export function Mark({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#111113" />
      <path
        d="M16 18 L32 32 L16 46"
        fill="none"
        stroke="#f4ead6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 18 L48 32 L32 46"
        fill="none"
        stroke="#f4ead6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22" r="2.4" fill="#f0c56e" />
    </svg>
  )
}
