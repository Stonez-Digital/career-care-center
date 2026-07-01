import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Type = 'error' | 'success' | 'warning' | 'info';

const config: Record<Type, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  error: { icon: XCircle, className: 'bg-error-50 text-error-700 border-error-200' },
  success: { icon: CheckCircle2, className: 'bg-success-50 text-success-700 border-success-200' },
  warning: { icon: AlertCircle, className: 'bg-warning-50 text-warning-600 border-warning-200' },
  info: { icon: Info, className: 'bg-primary-50 text-primary-700 border-primary-200' },
};

export default function Alert({
  type = 'info',
  message,
  className,
}: {
  type?: Type;
  message: string;
  className?: string;
}) {
  const { icon: Icon, className: c } = config[type];
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', c, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
