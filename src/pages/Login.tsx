import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { isAdminRole } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import AuthLayout from '@/components/AuthLayout';

export default function Login() {
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      const isAdmin = isAdminRole(user.app_metadata?.role) && isAdminRole(profile.role);
      navigate(from ?? (isAdmin ? '/admin' : '/dashboard'), { replace: true });
    }
  }, [from, navigate, profile, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    // After successful sign-in, the auth state change will trigger the
    // profile load. We navigate to a sensible default; the redirect logic
    // above will refine it once profile is available.
    navigate(from ?? '/dashboard', { replace: true });
  };

  return (
    <AuthLayout>
      <div className="card p-8 shadow-lift">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-soft">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-ink-500">Sign in to your CCC account to continue</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input type="email" className="input pl-11" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <Link to="/reset-password" className="text-xs font-semibold text-primary-700 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input type={showPassword ? 'text' : 'password'} className="input pl-11 pr-11" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : 'Sign In'}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-ink-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary-700 hover:underline">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
