import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, BookOpen, Bell, ArrowRight, TrendingUp, Clock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Application, EventRegistration, Notification, Resource } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, timeAgo, cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [isFirstVisit] = useState(() => profile?.has_seen_dashboard_welcome === false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [apps, regs, notifs, res] = await Promise.all([
        supabase.from('applications').select('*, program:programs(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('event_registrations').select('*, event:events(*)').eq('user_id', user.id).order('registered_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('resources').select('*').limit(4),
      ]);
      setApplications((apps.data as Application[]) ?? []);
      setRegistrations((regs.data as EventRegistration[]) ?? []);
      setNotifications((notifs.data as Notification[]) ?? []);
      setResources((res.data as Resource[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !isFirstVisit) return;

    void (async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ has_seen_dashboard_welcome: true })
        .eq('id', user.id)
        .eq('has_seen_dashboard_welcome', false);

      if (error) {
        console.error('[CCC] Could not record first dashboard welcome:', error.message);
        return;
      }
      await refreshProfile();
    })();
  }, [isFirstVisit, refreshProfile, user]);

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Applications', value: applications.length, icon: FileText, bg: 'from-primary-500 to-primary-700', surface: 'border-primary-100 bg-gradient-to-br from-white to-primary-50' },
    { label: 'Event Registrations', value: registrations.length, icon: Calendar, bg: 'from-secondary-400 to-secondary-600', surface: 'border-secondary-100 bg-gradient-to-br from-white to-secondary-50' },
    { label: 'Unread Notifications', value: notifications.filter((n) => !n.read).length, icon: Bell, bg: 'from-accent-400 to-accent-500', surface: 'border-accent-100 bg-gradient-to-br from-white to-accent-50' },
    { label: 'Available Resources', value: resources.length, icon: BookOpen, bg: 'from-success-500 to-success-600', surface: 'border-success-100 bg-gradient-to-br from-white to-success-50' },
  ];

  const statusVariant: Record<string, 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'> = {
    pending: 'warning', under_review: 'primary', approved: 'success', rejected: 'error',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-800 p-6 shadow-lift sm:p-8">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-primary-200">
            {isFirstVisit ? 'Welcome' : 'Welcome back'}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">
            {profile?.full_name?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="mt-2 max-w-md text-sm text-primary-100">
            {isFirstVisit
              ? "We're glad you're here. Explore your dashboard and begin your CCC journey."
              : "Here's an overview of your CCC journey. Keep growing and building your future."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn('stat-card group border transition-transform duration-200 hover:-translate-y-0.5', s.surface)}>
            <div className="flex items-center justify-between">
              <div className={cn('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110', s.bg)}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-heading text-3xl font-bold tabular-nums text-ink-900">{s.value}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="card border border-primary-100 bg-gradient-to-br from-white to-primary-50/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <h2 className="font-heading text-lg font-semibold text-ink-900">Recent Applications</h2>
            </div>
            <Link to="/dashboard/applications" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          {applications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/70 py-10 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm text-ink-500">No applications yet.</p>
              <Link to="/apply" className="btn-primary mt-4 text-sm">Apply Now</Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 transition-colors hover:border-primary-200 hover:bg-primary-50/30">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{a.program?.title ?? 'Program'}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="h-3 w-3" /> {formatDate(a.created_at)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[a.status]}>{a.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card border border-secondary-100 bg-gradient-to-br from-white to-secondary-50/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary-600" />
              <h2 className="font-heading text-lg font-semibold text-ink-900">Upcoming Events</h2>
            </div>
            <Link to="/dashboard/events" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
          </div>
          {registrations.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-secondary-100 bg-secondary-50/70 py-10 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-secondary-100 text-secondary-600">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-sm text-ink-500">No event registrations.</p>
              <Link to="/events" className="btn-primary mt-4 text-sm">Browse Events</Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {registrations.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5 transition-colors hover:border-secondary-200 hover:bg-secondary-50/30">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary-50 text-secondary-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{r.event?.title ?? 'Event'}</p>
                    <p className="text-xs text-ink-500">{r.event ? formatDate(r.event.event_date) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="card border border-accent-100 bg-gradient-to-br from-white to-accent-50/55 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent-500" />
            <h2 className="font-heading text-lg font-semibold text-ink-900">Latest Notifications</h2>
          </div>
          <Link to="/dashboard/notifications" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-accent-100 bg-accent-50/70 py-10 text-center text-sm font-medium text-accent-700">No notifications yet.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={cn('flex items-start gap-3 rounded-xl border p-3.5 transition-colors', n.read ? 'border-ink-100' : 'border-primary-200 bg-primary-50/40')}>
                <div className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', n.read ? 'bg-ink-100 text-ink-400' : 'bg-primary-100 text-primary-600')}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="text-xs text-ink-500">{n.body}</p>
                  <p className="mt-1 text-2xs text-ink-400">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources CTA */}
      <div className="card overflow-hidden border border-primary-100 bg-gradient-to-br from-white via-primary-50/30 to-success-50/50">
        <div className="relative flex items-center justify-between bg-gradient-to-br from-primary-700 to-primary-800 p-6 text-white">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent-400" />
              <h2 className="font-heading text-lg font-semibold">Explore Resources</h2>
            </div>
            <p className="mt-1 text-sm text-primary-100">Boost your skills with our learning hub</p>
          </div>
          <Link to="/dashboard/resources" className="btn-white relative text-sm">
            Browse <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((r) => (
            <div key={r.id} className="rounded-xl border border-primary-100 bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary-500" />
                <Badge variant="neutral">{r.type}</Badge>
              </div>
              <p className="font-medium text-ink-900 line-clamp-2">{r.title}</p>
              <p className="mt-1 text-xs text-ink-500">{r.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
