import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageSpinner } from './Spinner';
import type { UserRole } from '@/lib/supabase';

type Props = {
  children: React.ReactNode;
  adminOnly?: boolean;
  roles?: UserRole[];
};

export default function ProtectedRoute({ children, adminOnly = false, roles }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    const redirectTo = adminOnly ? '/admin/login' : '/login';
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (roles && roles.length > 0 && profile && !roles.includes(profile.role)) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
