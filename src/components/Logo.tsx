import { Link } from 'react-router-dom';

type LogoProps = {
  variant?: 'full' | 'compact';
  className?: string;
  textClassName?: string;
  to?: string;
};

export default function Logo({ variant = 'full', className = '', textClassName = '', to = '/' }: LogoProps) {
  return (
    <Link to={to} className={`inline-block ${className}`} aria-label="Career Care Center home">
      <img
        src="/career-care-logo.png?v=6"
        alt="Career Care Center — uplifting talents to make a meaningful impact"
        className={variant === 'compact' ? `h-14 w-auto ${textClassName}` : `h-24 w-auto ${textClassName}`}
      />
    </Link>
  );
}
