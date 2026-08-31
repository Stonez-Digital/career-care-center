import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageSpinner } from './Spinner';
import { isAdminRole, type UserRole } from '@/lib/supabase';

type Props = {
  children: React.ReactNode;
  adminOnly?: boolean;
  roles?: UserRole[];
  unauthenticatedTo?: string;
};

type AccessInput = {
  hasUser: boolean;
  profileRole: UserRole | null;
  metadataRole: unknown;
  profileSuspended?: boolean;
  adminOnly: boolean;
  roles?: UserRole[];
  unauthenticatedTo?: string;
};

export function protectedRouteDestination({
  hasUser,
  profileRole,
  metadataRole,
  profileSuspended = false,
  adminOnly,
  roles,
  unauthenticatedTo,
}: AccessInput): string | null {
  if (!hasUser) return unauthenticatedTo ?? (adminOnly ? '/admin/login' : '/login');
  if (profileSuspended) return '/unauthorized';
  const isAdmin = isAdminRole(metadataRole) && isAdminRole(profileRole);
  if (adminOnly && !isAdmin) return '/unauthorized';
  if (roles?.length && (!profileRole || !roles.includes(profileRole))) {
    return isAdmin ? '/admin' : '/unauthorized';
  }
  return null;
}

export default function ProtectedRoute({ children, adminOnly = false, roles, unauthenticatedTo }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  const destination = protectedRouteDestination({
    hasUser: Boolean(user),
    profileRole: profile?.role ?? null,
    metadataRole: user?.app_metadata?.role,
    profileSuspended: profile?.is_suspended ?? false,
    adminOnly,
    roles,
    unauthenticatedTo,
  });
  if (destination) {
    return <Navigate to={destination} state={!user ? { from: location.pathname } : undefined} replace />;
  }

  return <>{children}</>;
}
