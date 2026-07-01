import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Video, Users, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CCCEvent } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDate, cn } from '@/lib/utils';

export default function Events() {
  const [events, setEvents] = useState<CCCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
      setEvents((data as CCCEvent[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const register = async (eventId: string) => {
    if (!user) return;
    setError(null);
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id });
    if (error) {
      setError(error.code === '23505' ? 'You are already registered for this event.' : error.message);
    } else {
      setRegistered((r) => ({ ...r, [eventId]: true }));
    }
  };

  if (loading) return <PageLoader />;

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.event_date) >= now);
  const past = events.filter((e) => new Date(e.event_date) < now);

  const renderEventCard = (e: CCCEvent, isPast: boolean) => (
    <article key={e.id} className={cn('card group overflow-hidden transition-all hover:shadow-lift', isPast && 'opacity-90')}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={e.image_url ?? 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'}
          alt={e.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/30 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {e.is_virtual ? (
            <Badge variant="secondary" className="shadow-soft"><Video className="h-3 w-3" /> Virtual</Badge>
          ) : (
            <Badge variant="primary" className="shadow-soft"><MapPin className="h-3 w-3" /> In-person</Badge>
          )}
          {isPast && (
            <Badge variant="neutral" className="shadow-soft"><Clock className="h-3 w-3" /> Past</Badge>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-500">
          <Calendar className="h-3.5 w-3.5" /> {formatDate(e.event_date)}
        </div>
        <h3 className="font-heading text-lg font-semibold text-ink-900">{e.title}</h3>
        <p className="mt-2 text-sm text-ink-600 line-clamp-3">{e.description}</p>
        <div className="mt-3 flex items-center gap-3 text-sm text-ink-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {e.location}</span>
          {e.capacity && <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {e.capacity}</span>}
        </div>
        <div className="mt-4 border-t border-ink-100 pt-4">
          {isPast ? (
            <p className="text-sm font-medium text-ink-400">This event has concluded.</p>
          ) : registered[e.id] ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-success-600">
              <CheckCircle2 className="h-5 w-5" /> Registered!
            </div>
          ) : user ? (
            <button onClick={() => register(e.id)} className="btn-primary w-full text-sm">
              Register Now
            </button>
          ) : (
            <Link to="/login" className="btn-outline w-full text-sm">
              Login to Register
            </Link>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div>
      <PageHero
        eyebrow="Events"
        title="Join Our Events"
        description="Workshops, webinars, and training sessions to accelerate your career journey. From AI and graphics design to problem-solving and entrepreneurship."
      />

      <section className="section">
        <div className="container-page">
          {error && <Alert type="error" message={error} className="mb-6" />}

          {upcoming.length > 0 && (
            <>
              <h2 className="mb-6 font-heading text-2xl font-bold text-ink-900">Upcoming Events</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => renderEventCard(e, false))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mb-6 mt-12 font-heading text-2xl font-bold text-ink-900">Past Events</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => renderEventCard(e, true))}
              </div>
            </>
          )}

          {events.length === 0 && (
            <p className="py-20 text-center text-ink-500">No events listed. Check back soon!</p>
          )}
        </div>
      </section>
    </div>
  );
}
