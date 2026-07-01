import { Link } from 'react-router-dom';
import { Calendar, MapPin, Video, Users, ArrowRight } from 'lucide-react';
import type { CCCEvent } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import Badge from './Badge';

export default function EventCard({ event }: { event: CCCEvent }) {
  const eventDate = new Date(event.event_date);
  const day = eventDate.toLocaleDateString('en-NG', { day: '2-digit' });
  const month = eventDate.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase();

  return (
    <article className="card-hover group overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <img
          src={event.image_url ?? 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg'}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 to-transparent" />

        <div className="absolute left-3 top-3 overflow-hidden rounded-xl bg-white shadow-soft">
          <div className="grid h-12 w-12 place-items-center bg-white text-center">
            <span className="font-heading text-lg font-bold leading-none text-primary-700">{day}</span>
            <span className="text-2xs font-semibold text-ink-500">{month}</span>
          </div>
        </div>

        <div className="absolute right-3 top-3">
          {event.is_virtual ? (
            <Badge variant="secondary" className="shadow-soft">
              <Video className="h-3 w-3" /> Virtual
            </Badge>
          ) : (
            <Badge variant="primary" className="shadow-soft">
              <MapPin className="h-3 w-3" /> In-person
            </Badge>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(event.event_date)}
        </div>
        <h3 className="font-heading text-lg font-semibold text-ink-900 line-clamp-2">{event.title}</h3>
        <p className="mt-2 text-sm text-ink-600 line-clamp-2">{event.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
          <div className="flex items-center gap-1.5 text-sm text-ink-500">
            <Users className="h-4 w-4" />
            {event.capacity ? `${event.capacity} seats` : 'Open'}
          </div>
          <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800">
            Register
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
