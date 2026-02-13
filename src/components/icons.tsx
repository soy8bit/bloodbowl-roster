interface IconProps {
  size?: number;
  className?: string;
}

const defaultSize = 18;

export function FootballIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="7" x2="8" y2="17" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1.5" />
      <line x1="16" y1="7" x2="16" y2="17" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1.5" />
    </svg>
  );
}

export function DiceIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function WhistleIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="14" r="6" />
      <line x1="15" y1="9" x2="20" y2="4" />
      <circle cx="10" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

export function MegaphoneIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M18 3L6 9H3v6h3l12 6V3z" />
      <path d="M21 9c1 1 1 5 0 6" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function CoinIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12M9 9h6M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function PotionIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M9 3h6v3l4 10a3 3 0 01-3 3H8a3 3 0 01-3-3L9 6V3z" />
      <line x1="9" y1="3" x2="15" y2="3" strokeLinecap="round" />
      <path d="M7 14h10" strokeDasharray="2 2" />
    </svg>
  );
}

export function TrashIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}

export function ScrollIcon({ size = defaultSize, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}
