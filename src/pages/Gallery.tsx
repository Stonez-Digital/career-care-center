import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Facebook, Linkedin, Play, X } from 'lucide-react';
import Alert from '@/components/Alert';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import { supabase } from '@/lib/supabase';
import type { GalleryMedia } from '@/lib/supabase';

function MediaPreview({ item, expanded = false }: { item: GalleryMedia; expanded?: boolean }) {
  if (item.media_type === 'video') {
    return (
      <video
        src={item.media_url}
        poster={item.thumbnail_url ?? undefined}
        controls
        preload="metadata"
        className={expanded ? 'max-h-[75vh] w-full bg-ink-950 object-contain' : 'aspect-[4/3] w-full bg-ink-950 object-cover'}
      >
        Your browser does not support this video.
      </video>
    );
  }

  return (
    <img
      src={item.media_url}
      alt={item.alt_text ?? item.title}
      loading={expanded ? 'eager' : 'lazy'}
      className={expanded ? 'max-h-[75vh] w-full object-contain' : 'aspect-[4/3] w-full object-cover object-top'}
    />
  );
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [selected, setSelected] = useState<GalleryMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('media_gallery')
      .select('*')
      .eq('is_published', true)
      .order('display_order')
      .order('created_at', { ascending: false });
    if (loadError) setError('The media gallery could not be loaded. Please try again shortly.');
    setItems((data as GalleryMedia[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
              Explore verified images and videos published by Career Care Center.
            </p>
          </div>

          {loading ? <div className="mt-12"><PageLoader /></div> : null}
          {error ? <div className="mx-auto mt-10 max-w-2xl"><Alert type="error" message={error} /></div> : null}
          {!loading && !error && items.length === 0 ? (
            <div className="card mx-auto mt-12 max-w-2xl p-10 text-center text-ink-500">Media updates will appear here soon.</div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="card-hover overflow-hidden">
                  {item.media_type === 'image' ? (
                    <button type="button" onClick={() => setSelected(item)} className="relative block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-inset" aria-label={`View ${item.title}`}>
                      <MediaPreview item={item} />
                    </button>
                  ) : (
                    <div className="relative">
                      <MediaPreview item={item} />
                      <button type="button" onClick={() => setSelected(item)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink-950/75 text-white" aria-label={`Open ${item.title} in viewer`}>
                        <Play className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-semibold text-ink-900">{item.title}</h3>
                    {item.description ? <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.description}</p> : null}
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
                        View source <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-14 rounded-2xl bg-primary-50 p-6 text-center sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-ink-900">Follow the latest media and video updates</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-600">Visit the official social pages for announcements and live event coverage.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="https://www.facebook.com/careercarecenter" target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Facebook className="h-4 w-4" /> Facebook <ExternalLink className="h-4 w-4" />
              </a>
              <a href="https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative" target="_blank" rel="noopener noreferrer" className="btn-primary">
                <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}>
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-lift" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-ink-950/70 text-white transition-colors hover:bg-ink-950" aria-label="Close media viewer">
              <X className="h-5 w-5" />
            </button>
            <MediaPreview item={selected} expanded />
            <div className="p-5">
              <h2 className="font-heading text-xl font-semibold text-ink-900">{selected.title}</h2>
              {selected.description ? <p className="mt-2 text-sm text-ink-600">{selected.description}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
