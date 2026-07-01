import { Link } from 'react-router-dom';

type LogoProps = {
  variant?: 'full' | 'compact';
  className?: string;
  textClassName?: string;
  to?: string;
  dark?: boolean;
};

export default function Logo({ variant = 'full', className = '', textClassName = '', to = '/', dark = false }: LogoProps) {
  const textColor = dark ? 'text-white' : 'text-[#0D2175]';
  const tieColor = '#CB101D';

  if (variant === 'compact') {
    return (
      <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D2175] shadow-soft">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path d="M8 2 L12 2 L13 6 L10.5 8 L7.5 8 L5 6 Z" fill={tieColor} />
            <path d="M7.5 8 L10.5 8 L13 18 L10 24 L7 18 Z" fill={tieColor} />
            <path d="M8 9 L10 9 L10.5 17 L9 22 L7.5 17 Z" fill="#E11B28" opacity="0.5" />
          </svg>
        </span>
        {textClassName && (
          <span className={`font-heading text-lg font-bold ${textColor} ${textClassName}`}>
            Career<span style={{ color: tieColor }}>Care</span>
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 280 80" className="h-9 w-auto" fill="none" aria-label="Career Care Center">
        <text x="0" y="52" fontFamily="Poppins, Arial, sans-serif" fontSize="36" fontWeight="700" fill={dark ? '#FFFFFF' : '#0D2175'} letterSpacing="-1">CAREER</text>
        <text x="155" y="52" fontFamily="Poppins, Arial, sans-serif" fontSize="36" fontWeight="700" fill={dark ? '#FFFFFF' : '#0D2175'} letterSpacing="-1">CARE</text>
        <g transform="translate(262, 12)">
          <path d="M8 0 L16 0 L18 8 L14 12 L10 12 L6 8 Z" fill={tieColor} />
          <path d="M10 12 L14 12 L18 40 L12 56 L6 40 Z" fill={tieColor} />
          <path d="M11 14 L13 14 L14 38 L12 50 L10 38 Z" fill="#E11B28" opacity="0.5" />
        </g>
      </svg>
    </Link>
  );
}
