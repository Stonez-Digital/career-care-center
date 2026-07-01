import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

const variants: Record<Variant, string> = {
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-700',
  neutral: 'bg-ink-100 text-ink-700',
};

export default function Badge({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}
