import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Unauthorized() {
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="card max-w-md p-10 text-center shadow-lift">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-error-50 text-error-600">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Access Denied</h1>
        <p className="mt-3 text-sm text-ink-500">
          You don't have permission to access this page. This area is restricted to authorized users only.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link to="/" className="btn-outline">
            <Home className="h-4 w-4" /> Home
          </Link>
          {profile ? (
            <Link to="/dashboard" className="btn-primary">
              <ArrowLeft className="h-4 w-4" /> My Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
