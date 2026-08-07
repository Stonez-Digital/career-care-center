import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Heart, Briefcase, ShieldCheck,
  BookOpen, ClipboardList, FileText, Calendar, Video, Library,
  PenSquare, MessageSquare, Star, HeartHandshake, HandCoins, Megaphone,
  Mail, Bell, BarChart3, Settings, LogOut, Home, ChevronDown,
  Plus, FolderTree, UserCog, Archive, CalendarCheck, UserCheck, Activity,
  Sparkles, Download, MailOpen, Send,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Executive',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'User Management',
    items: [
      { to: '/admin/users', label: 'All Users', icon: Users },
      { to: '/admin/users?role=intern', label: 'Interns', icon: GraduationCap },
      { to: '/admin/users?role=volunteer', label: 'Volunteers', icon: Heart },
      { to: '/admin/users?role=mentor', label: 'Mentors', icon: Briefcase },
      { to: '/admin/users?role=admin', label: 'Administrators', icon: ShieldCheck },
    ],
  },
  {
    label: 'Programme Management',
    items: [
      { to: '/admin/programs', label: 'All Programmes', icon: BookOpen },
      { to: '/admin/programs?new=true', label: 'Create Programme', icon: Plus },
    ],
  },
  {
    label: 'Applications',
    items: [
      { to: '/admin/applications', label: 'All Applications', icon: ClipboardList },
      { to: '/admin/applications?status=pending', label: 'Pending', icon: FileText },
      { to: '/admin/applications?status=approved', label: 'Approved', icon: UserCheck },
      { to: '/admin/applications?status=rejected', label: 'Rejected', icon: Archive },
    ],
  },
  {
    label: 'Events',
    items: [
      { to: '/admin/events', label: 'All Events', icon: Calendar },
      { to: '/admin/events?filter=upcoming', label: 'Upcoming Events', icon: CalendarCheck },
      { to: '/admin/events?filter=past', label: 'Past Events', icon: Archive },
    ],
  },
  {
    label: 'Mentorship',
    items: [
      { to: '/admin/mentors', label: 'Mentors', icon: Briefcase },
      { to: '/admin/mentees', label: 'Mentees', icon: GraduationCap },
      { to: '/admin/sessions', label: 'Sessions', icon: Video },
    ],
  },
  {
    label: 'Volunteers',
    items: [
      { to: '/admin/volunteers', label: 'Applications', icon: ClipboardList },
      { to: '/admin/volunteers?status=approved', label: 'Active Volunteers', icon: UserCheck },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/admin/resources', label: 'All Resources', icon: Library },
    ],
  },
  {
    label: 'Blog CMS',
    items: [
      { to: '/admin/blog', label: 'Posts', icon: PenSquare },
    ],
  },
  {
    label: 'Testimonials',
    items: [
      { to: '/admin/testimonials', label: 'All Testimonials', icon: Star },
      { to: '/admin/testimonials?filter=pending', label: 'Pending Approval', icon: Sparkles },
    ],
  },
  {
    label: 'Partners',
    items: [
      { to: '/admin/partners', label: 'Partners', icon: HeartHandshake },
    ],
  },
  {
    label: 'Donations',
    items: [
      { to: '/admin/donations', label: 'Donations', icon: HandCoins },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/admin/reports', label: 'Analytics & Exports', icon: BarChart3 },
    ],
  },
  {
    label: 'Communications',
    items: [
      { to: '/admin/messages', label: 'Contact Messages', icon: Mail },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/newsletter', label: 'Newsletter Subscribers', icon: MailOpen },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
      { to: '/admin/settings', label: 'Site & SEO Settings', icon: Settings },
    ],
  },
];


function AdminNavLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
          isActive ? 'bg-primary-50 text-primary-700 shadow-soft' : 'text-ink-600 hover:bg-ink-50')
      }
    >
      <item.icon className="h-4 w-4 shrink-0 text-ink-400" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-ink-50/50">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2.5" aria-label="Career Care Center admin dashboard">
              <img src="/career-care-logo-v2.png" alt="" className="h-14 w-auto" />
              <div>
                <p className="font-heading text-sm font-bold text-ink-900">Admin Dashboard</p>
                <p className="text-xs text-ink-400">Career Care Center</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 sm:flex">
              <Home className="h-4 w-4" /> Back to Site
            </Link>
            <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-1.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-700 text-sm font-bold text-white">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-ink-900">{profile?.full_name ?? 'Admin'}</p>
                <p className="text-xs text-ink-400">Administrator</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-error-50 hover:text-error-600" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <nav className="card space-y-0.5 p-3">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-400 transition-colors hover:text-ink-600"
                  >
                    {group.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', collapsed[group.label] && 'rotate-180')} />
                  </button>
                  {!collapsed[group.label] && (
                    <div className="mb-1 space-y-0.5">
                      {group.items.map((item) => (
                        <AdminNavLink key={item.to} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
