import { useEffect, useState } from 'react';
import { ExternalLink, Facebook, Linkedin, X } from 'lucide-react';
import PageHero from '@/components/PageHero';

const mediaItems = [
  {
    src: '/media/events/smarter-skills-workshop-2.jpg',
    title: 'Smarter Skills for a Smarter Future – Workshop 2.0',
    description: 'Official event announcement for the World Youth Skills Day 2026 workshop in Asaba.',
  },
  {
    src: '/media/events/workshop-2-reminder.jpg',
    title: 'Workshop 2.0 Event Reminder',
    description: 'Event details and registration reminder for the two-day skills workshop.',
  },
  {
    src: '/media/events/workshop-2-speaker.jpg',
    title: 'Workshop Speaker Spotlight',
    description: 'Speaker media published as part of the Workshop 2.0 campaign.',
  },
  {
    src: '/media/events/workshop-2-countdown.jpg',
    title: 'Workshop 2.0 Countdown',
    description: 'Official countdown media leading up to the July 2026 event.',
  },
  {
    src: '/media/events/remote-work-ready.jpg',
    title: 'Remote Work Ready Webinar',
    description: 'Skills for the Global Talent Market virtual webinar announcement.',
  },
  {
    src: '/media/events/remote-work-ready-day.jpg',
    title: 'Remote Work Ready – Event Day',
    description: 'Official event-day reminder for the April 2026 virtual webinar.',
  },
  {
    src: '/media/events/career-acceleration-speakers.jpg',
    title: 'Career Acceleration Speakers',
    description: 'Speaker and facilitator spotlight from a Career Care acceleration programme.',
  },
] as const;

type MediaItem = (typeof mediaItems)[number];

export default function Gallery() {
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  return (
    <div>
      <PageHero
        eyebrow="Media Gallery"
        title="Learning, Growth and Impact"
        description="Official highlights from Career Care Center workshops, webinars and youth-development activities."
      />

      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Official Event Media</span>
            <h2 className="mt-3 heading-2">Career Care in Action</h2>
            <p className="mt-4 text-lg text-ink-600">
              Explore verified campaign graphics and event highlights published through Career Care Center's official social channels.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mediaItems.map((item) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setSelected(item)}
                className="card-hover overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                aria-label={`View ${item.title}`}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover object-top"
                />
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-14 rounded-2xl bg-primary-50 p-6 text-center sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-ink-900">Follow the latest media and video updates</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-600">
              Visit the official social pages for newly published videos, announcements and live event coverage.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://www.facebook.com/careercarecenter"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <Facebook className="h-4 w-4" /> Facebook <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div className="relative max-h-[92vh] max-w-4xl overflow-auto rounded-2xl bg-white shadow-lift" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-ink-950/70 text-white transition-colors hover:bg-ink-950"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={selected.src} alt={selected.title} className="max-h-[75vh] w-full object-contain" />
            <div className="p-5">
              <h2 className="font-heading text-xl font-semibold text-ink-900">{selected.title}</h2>
              <p className="mt-2 text-sm text-ink-600">{selected.description}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
