import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send, ArrowRight, CheckCircle2 } from 'lucide-react';

const footerLinks = {
  Platform: [
    { to: '/about', label: 'About Us' },
    { to: '/programs', label: 'Programs' },
    { to: '/events', label: 'Events' },
    { to: '/success-stories', label: 'Success Stories' },
  ],
  'Get Involved': [
    { to: '/apply', label: 'Apply' },
    { to: '/volunteer', label: 'Volunteer' },
    { to: '/donate', label: 'Donate' },
    { to: '/blog', label: 'Blog' },
  ],
  Account: [
    { to: '/login', label: 'Login' },
    { to: '/signup', label: 'Sign Up' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/contact', label: 'Contact' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-ink-300">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary-700/10 blur-3xl" />

      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0D2175] shadow-soft">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <path d="M8 2 L12 2 L13 6 L10.5 8 L7.5 8 L5 6 Z" fill="#CB101D" />
                  <path d="M7.5 8 L10.5 8 L13 18 L10 24 L7 18 Z" fill="#CB101D" />
                  <path d="M8 9 L10 9 L10.5 17 L9 22 L7.5 17 Z" fill="#E11B28" opacity="0.5" />
                </svg>
              </span>
              <span className="font-heading text-lg font-bold text-white">
                Career<span className="text-[#CB101D]">Care</span> Center
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-secondary-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-ink-400">Maryland, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-secondary-400">
                  <Mail className="h-4 w-4" />
                </div>
                <a href="mailto:info@careercarecenter.com" className="text-ink-400 transition-colors hover:text-white">
                  info@careercarecenter.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-secondary-400">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-ink-400">+234 815 124 6752</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                  {heading}
                </h4>
                <ul className="mt-4 space-y-3">
                  {links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-sm text-ink-400 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Stay Updated
            </h4>
            <p className="mt-4 text-sm text-ink-400">
              Get the latest career tips, event updates, and opportunities.
            </p>
            {subscribed ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm text-success-300">
                <CheckCircle2 className="h-4 w-4" />
                You're subscribed!
              </div>
            ) : (
              <form onSubmit={subscribe} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-ink-500 transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
                />
                <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary-500 text-white transition-all hover:bg-secondary-600 active:scale-95" aria-label="Subscribe">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            <div className="mt-6 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => {
                const socialLinks = [
                  'https://www.facebook.com/careercarecenter',
                  'https://www.instagram.com/careercarecenter',
                  'https://www.instagram.com/careercarecenter',
                  'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative',
                ];
                return (
                  <a
                    key={i}
                    href={socialLinks[i]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-ink-800 text-ink-400 transition-all hover:bg-primary-700 hover:text-white hover:-translate-y-0.5"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 sm:flex-row">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} Career Care Center. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <Link to="/about" className="transition-colors hover:text-ink-300">Privacy</Link>
            <Link to="/about" className="transition-colors hover:text-ink-300">Terms</Link>
            <Link to="/contact" className="transition-colors hover:text-ink-300">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
