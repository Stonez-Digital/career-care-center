import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/events', label: 'Events' },
  { to: '/success-stories', label: 'Stories' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenu(false);
    navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 safe-top',
        scrolled ? 'glass shadow-soft' : 'bg-transparent'
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-18">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0D2175] shadow-soft transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M8 2 L12 2 L13 6 L10.5 8 L7.5 8 L5 6 Z" fill="#CB101D" />
              <path d="M7.5 8 L10.5 8 L13 18 L10 24 L7 18 Z" fill="#CB101D" />
              <path d="M8 9 L10 9 L10.5 17 L9 22 L7.5 17 Z" fill="#E11B28" opacity="0.5" />
            </svg>
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-[#0D2175]">
            Career<span className="text-[#CB101D]">Care</span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary-700' : 'text-ink-600 hover:text-primary-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-primary-700" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/volunteer" className="btn-ghost btn-sm">
            Volunteer
          </Link>
          <Link
            to="/donate"
            className="btn-accent btn-sm group"
          >
            <Heart className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            Donate
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-medium transition-all hover:border-primary-300 hover:shadow-soft"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 text-xs font-bold text-white">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', userMenu && 'rotate-180')} />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift animate-fade-in-down">
                    <div className="border-b border-ink-100 bg-ink-50/50 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink-900">{profile?.full_name ?? 'User'}</p>
                      <p className="truncate text-xs text-ink-500">{profile?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
                      >
                        {profile?.role === 'admin' ? <Shield className="h-4 w-4 text-ink-400" /> : <LayoutDashboard className="h-4 w-4 text-ink-400" />}
                        {profile?.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-error-600 hover:bg-error-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/apply" className="btn-primary btn-sm">
                Apply Now
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden animate-fade-in-down">
          <div className="container-page flex flex-col gap-0.5 py-4">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-700 hover:bg-ink-50'
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="my-2 h-px bg-ink-100" />
            <Link to="/volunteer" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Volunteer
            </Link>
            <Link to="/donate" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-accent-600 hover:bg-accent-50">
              <Heart className="h-4 w-4" /> Donate
            </Link>
            {user ? (
              <>
                <div className="my-2 h-px bg-ink-100" />
                <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50">
                  {profile?.role === 'admin' ? <Shield className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                  {profile?.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error-600 hover:bg-error-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-3">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline flex-1 text-sm">
                  Login
                </Link>
                <Link to="/apply" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                  Apply Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
