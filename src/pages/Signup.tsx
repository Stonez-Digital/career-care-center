import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, GraduationCap, Briefcase, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { isAdminRole } from '@/lib/supabase';
import type { UserRole } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import AuthLayout from '@/components/AuthLayout';
import { cn } from '@/lib/utils';
import { safeInternalPath } from '@/lib/navigation';

const roles: { value: UserRole; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'intern', label: 'Intern', desc: 'Learn & grow', icon: GraduationCap },
  { value: 'mentor', label: 'Mentor', desc: 'Guide others', icon: Briefcase },
  { value: 'volunteer', label: 'Volunteer', desc: 'Give back', icon: Heart },
];

export default function Signup() {
  const { signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = safeInternalPath((location.state as { from?: string })?.from, '/dashboard');

  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'intern' as UserRole });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const isAdmin = isAdminRole(user.app_metadata?.role) && isAdminRole(profile.role);
      navigate(isAdmin ? '/admin' : requestedPath, { replace: true });
    }
  }, [navigate, profile, requestedPath, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error, requiresEmailConfirmation } = await signUp(form.email, form.password, form.full_name, form.role);
    setLoading(false);
    if (error) setError(error);
    else if (requiresEmailConfirmation) setConfirmationRequired(true);
    else navigate(requestedPath, { replace: true });
  };

  return (
    <AuthLayout>
      <div className="card p-8 shadow-lift">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-soft">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Create Account</h1>
          <p className="mt-2 text-sm text-ink-500">Join the CCC community and start your journey</p>
        </div>
        {confirmationRequired ? (
          <div className="mt-8"><Alert type="success" message="Account created. Check your email to verify your address, then sign in." /><Link to="/login" state={{ from: requestedPath }} className="btn-primary mt-5 w-full">Continue to Sign In</Link></div>
        ) : <form onSubmit={submit} className="mt-8 space-y-5">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input className="input pl-11" required placeholder="Your full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input type="email" className="input pl-11" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input type={showPassword ? 'text' : 'password'} className="input pl-11 pr-11" required placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={cn('flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all',
                    form.role === r.value ? 'border-primary-700 bg-primary-50 text-primary-700 shadow-soft' : 'border-ink-200 text-ink-600 hover:border-primary-300 hover:bg-ink-50')}
                >
                  <r.icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-2xs text-ink-400">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : 'Create Account'}
          </button>
        </form>}
        <p className="mt-7 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" state={{ from: requestedPath }} className="font-semibold text-primary-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
