import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Heart, Briefcase, ShieldCheck, ClipboardList,
  UserCheck, Clock, Calendar, Mail, FileText, Star, HandCoins,
  HeartHandshake, MessageSquare, TrendingUp, Activity, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, timeAgo, formatCurrency, cn } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Stats {
  totalUsers: number;
  interns: number;
  volunteers: number;
  mentors: number;
  admins: number;
  applications: number;
  approvedApps: number;
  pendingApps: number;
  upcomingEvents: number;
  registrations: number;
  blogPosts: number;
  testimonials: number;
  donations: number;
  partners: number;
  contactMessages: number;
}

interface ActivityItem {
  id: string;
  type: 'application' | 'registration' | 'contact' | 'donation' | 'volunteer';
  title: string;
  subtitle: string;
  created_at: string;
}

const programColors = ['#0F4C81', '#1E88E5', '#43A047', '#FB8C00', '#E53935', '#8E24AA', '#00ACC1', '#7CB342'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, interns: 0, volunteers: 0, mentors: 0, admins: 0,
    applications: 0, approvedApps: 0, pendingApps: 0, upcomingEvents: 0,
    registrations: 0, blogPosts: 0, testimonials: 0, donations: 0,
    partners: 0, contactMessages: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [appByStatus, setAppByStatus] = useState<any[]>([]);
  const [programDist, setProgramDist] = useState<any[]>([]);
  const [monthlyApps, setMonthlyApps] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [donationData, setDonationData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [
        profiles, apps, approved, pending, events, regs, blog, testimonials,
        donations, partners, messages, programs, recentA, recentU, upcomingE, recentM,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString()),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('testimonials').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('amount, status, frequency, created_at'),
        supabase.from('partners').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
        supabase.from('programs').select('title, category'),
        supabase.from('applications').select('full_name, program:programs(title), status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('title, event_date, location, is_virtual').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(5),
        supabase.from('contact_messages').select('name, email, subject, message, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      // Role counts
      const [interns, volunteers, mentors, admins] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'intern'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'volunteer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'super_admin']),
      ]);

      const donationAmount = (donations.data ?? []).filter((d: any) => d.status === 'completed').reduce((sum: number, d: any) => sum + Number(d.amount), 0);

      setStats({
        totalUsers: profiles.count ?? 0,
        interns: interns.count ?? 0,
        volunteers: volunteers.count ?? 0,
        mentors: mentors.count ?? 0,
        admins: admins.count ?? 0,
        applications: apps.count ?? 0,
        approvedApps: approved.count ?? 0,
        pendingApps: pending.count ?? 0,
        upcomingEvents: events.count ?? 0,
        registrations: regs.count ?? 0,
        blogPosts: blog.count ?? 0,
        testimonials: testimonials.count ?? 0,
        donations: donationAmount,
        partners: partners.count ?? 0,
        contactMessages: messages.count ?? 0,
      });

      setRecentApps(recentA.data ?? []);
      setRecentUsers(recentU.data ?? []);
      setUpcomingEvents(upcomingE.data ?? []);
      setRecentMessages(recentM.data ?? []);

      // Application status distribution
      const statusCounts: Record<string, number> = {};
      (recentA.data ?? []).forEach((a: any) => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1; });
      setAppByStatus(Object.entries({ pending: 0, under_review: 0, approved: 0, rejected: 0, ...statusCounts }).map(([name, value]) => ({ name, value })));

      // Program distribution
      const catCounts: Record<string, number> = {};
      (programs.data ?? []).forEach((p: any) => { catCounts[p.category] = (catCounts[p.category] ?? 0) + 1; });
      setProgramDist(Object.entries(catCounts).map(([name, value]) => ({ name, value })));

      // Monthly applications (last 6 months)
      const months: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        months.push({ month: monthName, applications: 0, users: 0, donations: 0 });
      }
      // Get all applications for monthly grouping
      const { data: allApps } = await supabase.from('applications').select('created_at').order('created_at', { ascending: false }).limit(500);
      (allApps ?? []).forEach((a: any) => {
        const d = new Date(a.created_at);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const m = months.find((m) => m.month === monthName);
        if (m) m.applications++;
      });
      setMonthlyApps(months);

      // User growth
      const { data: allUsers } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(500);
      const userMonths = [...months];
      (allUsers ?? []).forEach((u: any) => {
        const d = new Date(u.created_at);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const m = userMonths.find((m) => m.month === monthName);
        if (m) m.users++;
      });
      setUserGrowth(userMonths);

      // Donations by month
      const donationMonths = [...months];
      (donations.data ?? []).forEach((d: any) => {
        if (d.status !== 'completed') return;
        const dt = new Date(d.created_at);
        const monthName = dt.toLocaleString('default', { month: 'short' });
        const m = donationMonths.find((m) => m.month === monthName);
        if (m) m.donations += Number(d.amount);
      });
      setDonationData(donationMonths);

      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'from-primary-500 to-primary-700' },
    { label: 'Interns', value: stats.interns, icon: GraduationCap, bg: 'from-secondary-400 to-secondary-600' },
    { label: 'Volunteers', value: stats.volunteers, icon: Heart, bg: 'from-accent-400 to-accent-500' },
    { label: 'Mentors', value: stats.mentors, icon: Briefcase, bg: 'from-success-500 to-success-600' },
    { label: 'Administrators', value: stats.admins, icon: ShieldCheck, bg: 'from-ink-600 to-ink-800' },
    { label: 'Applications', value: stats.applications, icon: ClipboardList, bg: 'from-primary-600 to-primary-800' },
    { label: 'Approved', value: stats.approvedApps, icon: UserCheck, bg: 'from-success-500 to-success-700' },
    { label: 'Pending', value: stats.pendingApps, icon: Clock, bg: 'from-warning-400 to-warning-600' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, bg: 'from-secondary-500 to-secondary-700' },
    { label: 'Registrations', value: stats.registrations, icon: Calendar, bg: 'from-accent-500 to-accent-600' },
    { label: 'Blog Posts', value: stats.blogPosts, icon: FileText, bg: 'from-primary-500 to-secondary-500' },
    { label: 'Testimonials', value: stats.testimonials, icon: Star, bg: 'from-secondary-400 to-accent-400' },
    { label: 'Donations', value: formatCurrency(stats.donations), icon: HandCoins, bg: 'from-success-500 to-accent-500' },
    { label: 'Partners', value: stats.partners, icon: HeartHandshake, bg: 'from-primary-600 to-accent-500' },
    { label: 'Messages', value: stats.contactMessages, icon: MessageSquare, bg: 'from-accent-400 to-primary-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-ink-500">Real-time platform statistics and activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={cn('mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft', s.bg)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="font-heading text-2xl font-bold tabular-nums text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-ink-900">Monthly Applications</h2>
          <p className="text-sm text-ink-500">Application volume over the last 6 months</p>
          <ResponsiveContainer width="100%" height={260} className="mt-4">
            <AreaChart data={monthlyApps}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              <Area type="monotone" dataKey="applications" stroke="#0F4C81" strokeWidth={2} fill="url(#appGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-ink-900">User Growth</h2>
          <p className="text-sm text-ink-500">New user registrations over time</p>
          <ResponsiveContainer width="100%" height={260} className="mt-4">
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              <Line type="monotone" dataKey="users" stroke="#1E88E5" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-ink-900">Applications by Status</h2>
          <ResponsiveContainer width="100%" height={240} className="mt-4">
            <PieChart>
              <Pie data={appByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {appByStatus.map((_, i) => <Cell key={i} fill={programColors[i % programColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-ink-900">Programme Popularity</h2>
          <ResponsiveContainer width="100%" height={240} className="mt-4">
            <BarChart data={programDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={100} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              <Bar dataKey="value" fill="#0F4C81" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-ink-900">Donations Overview</h2>
          <ResponsiveContainer width="100%" height={240} className="mt-4">
            <BarChart data={donationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} />
              <Bar dataKey="donations" fill="#43A047" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Recent Applications</h2>
            <Link to="/admin/applications" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {recentApps.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No applications yet.</p>
            ) : (
              recentApps.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 transition-colors hover:border-primary-200">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{a.full_name}</p>
                    <p className="text-xs text-ink-500">{a.program?.title ?? 'Programme'} · {timeAgo(a.created_at)}</p>
                  </div>
                  <Badge variant={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : a.status === 'rejected' ? 'error' : 'primary'}>
                    {a.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Recent Registrations</h2>
            <Link to="/admin/users" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {recentUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No registrations yet.</p>
            ) : (
              recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 transition-colors hover:border-primary-200">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                      {u.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{u.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-ink-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{u.role}</Badge>
                    <span className="text-xs text-ink-400">{timeAgo(u.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events & Contact Messages */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Upcoming Events</h2>
            <Link to="/admin/events" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {upcomingEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No upcoming events.</p>
            ) : (
              upcomingEvents.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 transition-colors hover:border-primary-200">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{e.title}</p>
                    <p className="text-xs text-ink-500">{formatDate(e.event_date)} · {e.location}</p>
                  </div>
                  <Badge variant={e.is_virtual ? 'secondary' : 'primary'}>{e.is_virtual ? 'Virtual' : 'In-person'}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Latest Contact Messages</h2>
            <Link to="/admin/messages" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {recentMessages.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No messages yet.</p>
            ) : (
              recentMessages.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 transition-colors hover:border-primary-200">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{m.name}</p>
                    <p className="truncate text-xs text-ink-500">{m.subject ?? m.message.slice(0, 50)}</p>
                  </div>
                  <Badge variant={m.status === 'unread' ? 'warning' : m.status === 'replied' ? 'success' : 'neutral'}>
                    {m.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
