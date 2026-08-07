import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { isAdminRole } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

export default function AdminLogin() {
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAdminRole(user?.app_metadata?.role) && isAdminRole(profile?.role)) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, navigate, profile?.role, user]);

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
    navigate(from, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-primary-900 px-4 py-12">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center" aria-label="Career Care Center home">
          <img src="/career-care-logo.png" alt="Career Care Center — uplifting talents to make a meaningful impact" className="h-28 w-auto" />
        </Link>

        <div className="card p-8 shadow-lift">
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 text-white shadow-soft">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-ink-900">Admin Portal</h1>
            <p className="mt-2 text-sm text-ink-500">Restricted access. Authorized administrators only.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && <Alert type="error" message={error} />}
            <div>
              <label className="label">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input type="email" className="input pl-11" required placeholder="admin@careercare.org" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input type={showPassword ? 'text' : 'password'} className="input pl-11 pr-11" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-700">
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
