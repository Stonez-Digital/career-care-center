import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import AuthLayout from '@/components/AuthLayout';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  };

  return (
    <AuthLayout>
      <div className="card p-8 shadow-lift">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 text-white shadow-soft">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Reset Password</h1>
          <p className="mt-2 text-sm text-ink-500">Enter your email and we'll send you a reset link</p>
        </div>
        {success ? (
          <div className="mt-8">
            <Alert type="success" message="Reset link sent! Check your email for instructions." />
            <Link to="/login" className="btn-outline mt-5 w-full">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && <Alert type="error" message={error} />}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input type="email" className="input pl-11" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : <><Send className="h-4 w-4" /> Send Reset Link</>}
            </button>
          </form>
        )}
        <p className="mt-7 text-center text-sm text-ink-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
