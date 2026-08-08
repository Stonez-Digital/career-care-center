import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard, User, FileText, Calendar, BookOpen, HeartHandshake, Bell, LogOut, Home, ChevronRight,
  ClipboardList, Activity, Clock3, CalendarCheck, History, Users, Video, CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/supabase';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };

const internLinks: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/applications', label: 'My Applications', icon: FileText },
  { to: '/dashboard/events', label: 'My Events', icon: Calendar },
  { to: '/dashboard/resources', label: 'Career Resources', icon: BookOpen },
  { to: '/dashboard/mentorship', label: 'Mentorship', icon: HeartHandshake },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const volunteerLinks: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/volunteer-opportunities', label: 'Volunteer Opportunities', icon: ClipboardList },
  { to: '/dashboard/assigned-activities', label: 'Assigned Activities', icon: Activity },
  { to: '/dashboard/volunteer-schedule', label: 'Volunteer Schedule', icon: CalendarCheck },
  { to: '/dashboard/availability', label: 'Availability', icon: Clock3 },
  { to: '/dashboard/volunteer-history', label: 'Volunteer History', icon: History },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const mentorLinks: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/mentees', label: 'Assigned Mentees', icon: Users },
  { to: '/dashboard/mentor-sessions', label: 'Mentor Sessions', icon: Video },
  { to: '/dashboard/resources', label: 'Resources', icon: BookOpen },
  { to: '/dashboard/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const roleLinks: Record<UserRole, NavItem[]> = {
  intern: internLinks,
  volunteer: volunteerLinks,
  mentor: mentorLinks,
  admin: internLinks, // admins use the admin portal, not the user dashboard
  super_admin: internLinks, // super admins use the admin portal
};

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const links = roleLinks[profile?.role ?? 'intern'] ?? internLinks;

  return (
    <div className="min-h-screen bg-ink-50/50">
      <div className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="card overflow-hidden p-0">
              <div className="bg-[#0D2175] p-5">
                <div className="flex items-center gap-3">
                  <img src="/career-care-logo-v3.png" alt="Career Care Center" className="h-16 w-auto shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold text-white">{profile?.full_name ?? 'User'}</p>
                    <p className="truncate text-sm capitalize text-primary-200">{profile?.role}</p>
                  </div>
                </div>
              </div>
              <nav className="space-y-0.5 p-3">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isActive ? 'bg-primary-50 text-primary-700 shadow-soft' : 'text-ink-600 hover:bg-ink-50')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <l.icon className={cn('h-4 w-4', isActive ? 'text-primary-700' : 'text-ink-400')} />
                        {l.label}
                        {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary-400" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="space-y-0.5 border-t border-ink-100 p-3">
                <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50">
                  <Home className="h-4 w-4 text-ink-400" />
                  Back to Website
                </Link>
                <button onClick={async () => { await signOut(); window.location.href = '/'; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </aside>
          <div className="min-w-0">{children ?? <Outlet />}</div>
        </div>
      </div>
    </div>
  );
}
