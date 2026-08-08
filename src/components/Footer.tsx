import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { WHATSAPP_URL } from '@/lib/contact';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const { data, error: requestError } = await supabase.functions.invoke('newsletter-subscribe', {
        body: { email },
      });
      if (requestError) throw requestError;
      if (data?.error) throw new Error(data.error);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to subscribe right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-ink-300">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary-700/10 blur-3xl" />

      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block" aria-label="Career Care Center home">
              <img
                src="/career-care-logo.png?v=5"
                alt="Career Care Center — uplifting talents to make a meaningful impact"
                className="h-28 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">
              Equipping young people with the skills, networks, knowledge, and opportunities they need to build meaningful careers.
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
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-secondary-400">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-ink-400 transition-colors hover:text-white">
                  Join our WhatsApp Jobs Group
                </a>
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary-500 text-white transition-all hover:bg-secondary-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={submitting ? 'Subscribing' : 'Subscribe'}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}
            {error && <p className="mt-2 text-sm text-error-300" role="alert">{error}</p>}
            <div className="mt-6 flex gap-2">
              {[
                { Icon: Facebook, label: 'Career Care Center on Facebook', href: 'https://www.facebook.com/careercarecenter' },
                { Icon: Twitter, label: 'Career Care Center on X', href: 'https://x.com/careercarecenter' },
                { Icon: Instagram, label: 'Career Care Center on Instagram', href: 'https://www.instagram.com/careercarecenter' },
                { Icon: Linkedin, label: 'Career Care Center on LinkedIn', href: 'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative' },
                { Icon: MessageCircle, label: 'Join the Career Care Center Jobs WhatsApp group', href: WHATSAPP_URL },
              ].map(({ Icon, label, href }) => {
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-ink-800 text-ink-400 transition-all hover:bg-primary-700 hover:text-white hover:-translate-y-0.5"
                    aria-label={label}
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
