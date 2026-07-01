import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import type { Program } from '@/lib/supabase';

const categoryColors: Record<string, string> = {
  'Career Coaching': 'from-primary-600 to-primary-800',
  'Career Mentorship': 'from-secondary-500 to-secondary-700',
  'Internship Support': 'from-accent-400 to-accent-600',
  'Internship Placement': 'from-accent-400 to-accent-600',
  'Entrepreneurship Development': 'from-success-500 to-success-700',
  'CV Review': 'from-primary-500 to-primary-700',
  'LinkedIn Optimization': 'from-secondary-400 to-secondary-600',
  'Leadership Development': 'from-accent-500 to-accent-700',
  'Skills Development': 'from-primary-600 to-secondary-500',
  'Digital Skills Training': 'from-primary-600 to-secondary-500',
  'Career Assessment': 'from-secondary-500 to-accent-400',
  'Employability Skills Training': 'from-success-500 to-accent-500',
  'Graduate Employability': 'from-primary-500 to-accent-500',
  'Job Readiness': 'from-primary-600 to-primary-800',
  'Youth Empowerment': 'from-secondary-500 to-primary-600',
  'Professional Development': 'from-accent-500 to-primary-700',
};

export default function ProgramCard({ program }: { program: Program }) {
  const gradient = categoryColors[program.category] ?? 'from-primary-600 to-primary-800';

  return (
    <article className="card-hover group relative flex flex-col overflow-hidden p-6">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

      <div className="mb-5 flex items-start justify-between">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-soft`}>
          <span className="font-heading text-xl font-bold">{program.category[0]}</span>
        </div>
        {program.duration && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-2xs font-semibold text-ink-500">
            <Clock className="h-3 w-3" />
            {program.duration}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-secondary-600">{program.category}</p>
        <h3 className="mt-1.5 font-heading text-xl font-semibold text-ink-900">{program.title}</h3>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-600 line-clamp-2">{program.description}</p>

      <div className="mt-5 space-y-2">
        {program.benefits.slice(0, 3).map((b) => (
          <div key={b} className="flex items-start gap-2 text-sm text-ink-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
            <span className="line-clamp-1">{b}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
        <span className="text-xs font-medium text-ink-400">{program.requirements.length} requirements</span>
        <Link
          to="/apply"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
        >
          Apply
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
