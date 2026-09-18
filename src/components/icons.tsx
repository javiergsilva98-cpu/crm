type IconProps = { className?: string };

const base = "none";

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10v9a1 1 0 0 0 1 1H9.5v-6h5v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.2a3 3 0 0 1 0 5.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14.2c2.3.4 4 2.2 4 4.8" />
    </svg>
  );
}

export function CupIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h10l-1 11a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4L6 4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20h8" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3.5" y="6.5" width="17" height="12" rx="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10h17" />
      <circle cx="16.5" cy="14.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 8 8.5-4.5L20.5 8v8L12 20.5 3.5 16V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8 12 12.5 20.5 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.5v8" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path strokeLinecap="round" d="M3.5 9.5h17" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="8" cy="15" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.5 18 5m0 0h-3.5M18 5v3.5" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={2.2} className={className}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function VoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 12.5 2.5 2.5 6-6" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={2.4} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={2.6} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={base} stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H9" />
    </svg>
  );
}
