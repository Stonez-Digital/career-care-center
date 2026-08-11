import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 text-ink-600 shadow-soft transition-all hover:border-primary-300 hover:text-primary-700',
        className,
      )}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {showLabel ? <span className="text-sm font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span> : null}
    </button>
  );
}
