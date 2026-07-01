import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, BellOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import { timeAgo, cn } from '@/lib/utils';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications((data as Notification[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((n) => n.filter((x) => x.id !== id));
  };

  if (loading) return <PageLoader />;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Notifications</h1>
          <p className="mt-1 text-ink-500">{unread} unread of {notifications.length} total</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-outline text-sm">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <BellOff className="mx-auto h-12 w-12 text-ink-300" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-ink-900">No notifications</h3>
          <p className="mt-2 text-sm text-ink-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn('card flex items-start gap-4 p-4 transition-colors', !n.read && 'border-primary-200 bg-primary-50/30')}
            >
              <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', n.read ? 'bg-ink-100 text-ink-400' : 'bg-primary-100 text-primary-700')}>
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-accent-400" />}
                </div>
                <p className="mt-0.5 text-sm text-ink-600">{n.body}</p>
                <p className="mt-1 text-xs text-ink-400">{timeAgo(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-success-600" aria-label="Mark read">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => remove(n.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-error-50 hover:text-error-600" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
