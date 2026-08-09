import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import AuthLayout from '@/components/AuthLayout';
import { getSiteUrl } from '@/lib/siteUrl';

export default function ResetPassword() {
  const [recoveryCallback] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    return window.location.hash.includes('type=recovery') || search.has('code') || search.get('type') === 'recovery';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(recoveryCallback);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoveryMode(true);
        setRecoveryReady(true);
        setCheckingRecovery(false);
      }
    });

    void (async () => {
      let { data: sessionData } = await supabase.auth.getSession();
      const code = new URLSearchParams(window.location.search).get('code');

      if (!sessionData.session && code) {
        const exchange = await supabase.auth.exchangeCodeForSession(code);
        sessionData = exchange.data;
      }

      if (!active) return;
      if (sessionData.session) {
        setRecoveryMode(true);
        setRecoveryReady(true);
      } else if (recoveryCallback) {
        setRecoveryMode(true);
        setError('This password-reset link is invalid or has expired. Request a new link and use the most recent email.');
      }
      setCheckingRecovery(false);
    })();

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [recoveryCallback]);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${getSiteUrl()}/reset-password`,
    });
    setLoading(false);
    if (requestError) setError(requestError.message);
    else setSuccess(true);
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      await supabase.auth.signOut({ scope: 'local' });
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="card p-8 shadow-lift">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 text-white shadow-soft">
            {recoveryMode ? <Lock className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">{recoveryMode ? 'Choose New Password' : 'Reset Password'}</h1>
          <p className="mt-2 text-sm text-ink-500">{recoveryMode ? 'Enter a secure password for your account' : "Enter your email and we'll send you a reset link"}</p>
        </div>

        {checkingRecovery ? (
          <div className="mt-8 flex justify-center"><Spinner /></div>
        ) : success ? (
          <div className="mt-8">
            <Alert type="success" message={recoveryMode ? 'Password updated successfully. You can now sign in.' : 'Reset link sent! Check your email for instructions.'} />
            <Link to="/login" className="btn-outline mt-5 w-full"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
          </div>
        ) : recoveryMode && recoveryReady ? (
          <form onSubmit={updatePassword} className="mt-8 space-y-5">
            {error && <Alert type="error" message={error} />}
            <div><label className="label">New Password</label><input type="password" className="input" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
            <div><label className="label">Confirm Password</label><input type="password" className="input" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner /> : 'Update Password'}</button>
          </form>
        ) : recoveryMode ? (
          <div className="mt-8 space-y-5">
            {error && <Alert type="error" message={error} />}
            <button type="button" onClick={() => { setRecoveryMode(false); setError(null); }} className="btn-primary w-full">
              Request New Reset Link
            </button>
          </div>
        ) : (
          <form onSubmit={requestReset} className="mt-8 space-y-5">
            {error && <Alert type="error" message={error} />}
            <div><label className="label">Email Address</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" /><input type="email" className="input pl-11" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner /> : <><Send className="h-4 w-4" /> Send Reset Link</>}</button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
