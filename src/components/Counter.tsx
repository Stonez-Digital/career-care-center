import { useEffect, useRef, useState } from 'react';

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export default function Counter({ end, duration = 2000, suffix = '', label, icon, variant = 'dark' }: CounterProps) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(end);
    };
    requestAnimationFrame(step);
  }, [visible, end, duration]);

  const isDark = variant === 'dark';

  return (
    <div ref={ref} className="group text-center">
      {icon && (
        <div className={`mb-4 flex justify-center transition-transform duration-300 group-hover:scale-110 ${isDark ? 'text-secondary-400' : 'text-primary-600'}`}>
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ${isDark ? 'bg-white/10' : 'bg-primary-50'}`}>
            {icon}
          </div>
        </div>
      )}
      <div className={`font-heading text-4xl font-bold tabular-nums sm:text-5xl ${isDark ? 'text-white' : 'text-ink-900'}`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className={`mt-2 text-sm font-medium ${isDark ? 'text-primary-100' : 'text-ink-500'}`}>
        {label}
      </div>
    </div>
  );
}
