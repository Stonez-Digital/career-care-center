import { Link } from 'react-router-dom';
import { Sparkles, Quote, Heart, Users, TrendingUp } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand Panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-secondary-500/15 blur-3xl" />
        <div className="absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />

        <div className="relative">
          <Link to="/" className="inline-block" aria-label="Career Care Center home">
            <img src="/career-care-logo-v3.png" alt="Career Care Center — uplifting talents to make a meaningful impact" className="h-28 w-auto" />
          </Link>
        </div>

        <div className="relative max-w-md">
          <Quote className="h-10 w-10 text-white/20" />
          <p className="mt-4 font-heading text-2xl font-semibold leading-snug text-white text-pretty">
            "Career Care Centre is an amazing community to be in. I was privileged to go through the career assessment and consultation. It was an amazing experience."
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white font-bold backdrop-blur-md ring-1 ring-white/20">
              ID
            </div>
            <div>
              <p className="font-semibold text-white">The Identity Doctor</p>
              <p className="text-sm text-primary-200">Lead Consultant, Proflex Career Solutions, Lagos</p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { icon: Users, value: '500+', label: 'Youth Reached' },
            { icon: TrendingUp, value: '20+', label: 'Workshops' },
            { icon: Heart, value: '30+', label: 'Volunteers' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/5 p-4 backdrop-blur-md ring-1 ring-white/10">
              <s.icon className="h-5 w-5 text-secondary-400" />
              <p className="mt-2 font-heading text-xl font-bold text-white">{s.value}</p>
              <p className="text-2xs text-primary-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center bg-ink-50 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary-700 to-primary-800 text-white font-heading font-bold shadow-soft">
                C
              </span>
              <span className="font-heading text-lg font-bold text-ink-900">
                Career<span className="text-secondary-600">Care</span>
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
