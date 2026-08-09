import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Heart, Mail, Calendar, CheckCircle2, Bell,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { cn, timeAgo } from '@/lib/utils';
import { reportMutationError } from '@/lib/mutations';

type NotificationType = 'application' | 'volunteer' | 'contact' | 'event';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  created_at: string;
  link: string;
  sourceTable: 'applications' | 'volunteers' | 'contact_messages' | 'events';
  sourceId: string;
  read: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; label: string }
> = {
  application: { icon: ClipboardList, bg: 'bg-primary-50', text: 'text-primary-700', label: 'Application' },
  volunteer: { icon: Heart, bg: 'bg-accent-50', text: 'text-accent-600', label: 'Volunteer' },
  contact: { icon: Mail, bg: 'bg-warning-50', text: 'text-warning-600', label: 'Message' },
  event: { icon: Calendar, bg: 'bg-secondary-50', text: 'text-secondary-600', label: 'Event' },
};

const filterTabs: ('all' | NotificationType)[] = ['all', 'application', 'volunteer', 'contact', 'event'];

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  useEffect(() => {
    (async () => {
      const [apps, vols, msgs, events] = await Promise.all([
        supabase
          .from('applications')
          .select('id, full_name, status, created_at, program:programs(title)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('volunteers')
          .select('id, name, status, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('contact_messages')
          .select('id, name, subject, status, created_at')
          .eq('status', 'unread')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('events')
          .select('id, title, event_date, location')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(10),
      ]);

      const notificationItems: NotificationItem[] = [];

      (apps.data ?? []).forEach((a: any) => {
        notificationItems.push({
          id: `app-${a.id}`,
          type: 'application',
          title: `New application from ${a.full_name}`,
          description: a.program?.title
            ? `Programme: ${a.program.title}`
            : 'Programme application pending review',
          created_at: a.created_at,
          link: '/admin/applications',
          sourceTable: 'applications',
          sourceId: a.id,
          read: a.status !== 'pending',
        });
      });

      (vols.data ?? []).forEach((v: any) => {
        notificationItems.push({
          id: `vol-${v.id}`,
          type: 'volunteer',
          title: `New volunteer application from ${v.name}`,
          description: 'Volunteer application pending review',
          created_at: v.created_at,
          link: '/admin/volunteers',
          sourceTable: 'volunteers',
          sourceId: v.id,
          read: v.status !== 'pending',
        });
      });

      (msgs.data ?? []).forEach((m: any) => {
        notificationItems.push({
          id: `msg-${m.id}`,
          type: 'contact',
          title: `New message from ${m.name}`,
          description: m.subject ?? 'Contact form submission',
          created_at: m.created_at,
          link: '/admin/messages',
          sourceTable: 'contact_messages',
          sourceId: m.id,
          read: m.status !== 'unread',
        });
      });

      (events.data ?? []).forEach((e: any) => {
        notificationItems.push({
          id: `evt-${e.id}`,
          type: 'event',
          title: `Upcoming event: ${e.title}`,
          description: `${e.location} · ${new Date(e.event_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`,
          created_at: e.event_date,
          link: '/admin/events',
          sourceTable: 'events',
          sourceId: e.id,
          read: false,
        });
      });

      notificationItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(notificationItems);
      setLoading(false);
    })();
  }, []);

  const markAsRead = async (item: NotificationItem) => {
    let mutationError: { message?: string } | null = null;
    // Update the source table status to mark as "read"
    if (item.type === 'application') {
      const { error } = await supabase.from('applications').update({ status: 'under_review' }).eq('id', item.sourceId);
      mutationError = error;
    } else if (item.type === 'volunteer') {
      // No "read" status for volunteers; we leave as-is but mark locally
    } else if (item.type === 'contact') {
      const { error } = await supabase.from('contact_messages').update({ status: 'read' }).eq('id', item.sourceId);
      mutationError = error;
    }
    if (reportMutationError('mark this notification as read', mutationError)) return;
    // Events have no status to update
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
  };

  const filtered = filter === 'all' ? items : items.filter((n) => n.type === filter);
  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Notifications</h1>
        <p className="text-sm text-ink-500">
          {items.length} total · {unreadCount} unread
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-ink-400" />
        {filterTabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === t ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            )}
          >
            {t === 'all' ? 'All' : typeConfig[t as NotificationType].label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">No notifications. You're all caught up!</p>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {filtered.map((item) => {
            const cfg = typeConfig[item.type];
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-4 p-4 transition-colors hover:bg-ink-50/50',
                  !item.read && 'bg-primary-50/30'
                )}
              >
                <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', cfg.bg, cfg.text)}>
                  <cfg.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink-900">{item.title}</p>
                    {!item.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-600">{item.description}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Badge variant="neutral">{cfg.label}</Badge>
                    <span className="text-xs text-ink-400">{timeAgo(item.created_at)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!item.read && (
                    <button
                      onClick={() => markAsRead(item)}
                      className="text-sm font-semibold text-primary-700 hover:underline"
                    >
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      Mark read
                    </button>
                  )}
                  <Link
                    to={item.link}
                    className="text-sm font-semibold text-ink-600 hover:text-primary-700 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
