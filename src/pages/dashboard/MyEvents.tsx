import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Video, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { EventRegistration } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils';
import SafeImage from '@/components/SafeImage';

const eventFallback = '/media/events/workshop-2-reminder.jpg';

export default function MyEvents() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('event_registrations')
        .select('*, event:events(*)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
      setRegistrations((data as EventRegistration[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <PageLoader />;

  const upcoming = registrations.filter((r) => r.event && new Date(r.event.event_date) > new Date());
  const past = registrations.filter((r) => r.event && new Date(r.event.event_date) <= new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">My Events</h1>
          <p className="mt-1 text-ink-500">Events you've registered for</p>
        </div>
        <Link to="/events" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Browse Events
        </Link>
      </div>

      {registrations.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-ink-300" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-ink-900">No registrations yet</h3>
          <p className="mt-2 text-sm text-ink-500">Browse our events and register to attend.</p>
          <Link to="/events" className="btn-primary mt-6">Browse Events</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold text-ink-900">Upcoming</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((r) => (
                  <div key={r.id} className="card overflow-hidden">
                    {r.event?.image_url && (
                      <SafeImage src={r.event.image_url} fallbackSrc={eventFallback} alt={r.event.title} loading="lazy" className="h-32 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        {r.event?.is_virtual ? (
                          <Badge variant="secondary"><Video className="h-3 w-3" /> Virtual</Badge>
                        ) : (
                          <Badge variant="primary"><MapPin className="h-3 w-3" /> In-person</Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-heading font-semibold text-ink-900">{r.event?.title}</h3>
                      <p className="mt-1 text-sm text-ink-500">{r.event && formatDate(r.event.event_date)}</p>
                      <p className="flex items-center gap-1.5 text-sm text-ink-500">
                        {r.event?.is_virtual ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {r.event?.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold text-ink-900">Past Events</h2>
              <div className="space-y-3">
                {past.map((r) => (
                  <div key={r.id} className="card flex items-center gap-4 p-4 opacity-75">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-100 text-ink-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-ink-700">{r.event?.title}</p>
                      <p className="text-sm text-ink-400">{r.event && formatDate(r.event.event_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
