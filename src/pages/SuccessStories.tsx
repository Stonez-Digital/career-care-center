import { useEffect, useState } from 'react';
import { Quote, Star, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Testimonial } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

export default function SuccessStories() {
  const [stories, setStories] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', role: '', quote: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
      setStories((data as Testimonial[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('testimonials').insert({ ...form, approved: false });
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setForm({ name: '', role: '', quote: '', rating: 5 });
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Success Stories"
        title="Real Stories, Real Impact"
        description="Hear from those whose careers and lives have been impacted through CCC programs and initiatives."
      />

      <section className="section">
        <div className="container-page">
          {loading ? (
            <PageLoader />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((t) => (
                <article key={t.id} className="card p-6">
                  <Quote className="h-8 w-8 text-secondary-400" />
                  <p className="mt-4 text-sm leading-relaxed text-ink-700">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                    <img
                      src={t.image_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0F4C81&color=fff`}
                      alt={t.name}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-ink-900">{t.name}</p>
                      <p className="text-sm text-ink-500">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent-400 text-accent-400" />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section bg-ink-100/50">
        <div className="container-narrow">
          <div className="card p-8">
            <div className="text-center">
              <h2 className="heading-3">Share Your Story</h2>
              <p className="mt-2 text-ink-600">Your journey can inspire others. Tell us how CCC helped you.</p>
            </div>
            {success ? (
              <div className="mt-6">
                <Alert type="success" message="Thank you! Your story has been submitted for review." />
                <button onClick={() => setSuccess(false)} className="btn-ghost mt-4">Share another story</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && <Alert type="error" message={error} />}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Current Role *</label>
                    <input className="input" required placeholder="e.g. Program Participant, Mentor" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Your Story *</label>
                  <textarea className="input min-h-[120px]" required placeholder="Tell us about your journey with CCC..." value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
                </div>
                <div>
                  <label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                        <Star className={`h-7 w-7 ${n <= form.rating ? 'fill-accent-400 text-accent-400' : 'text-ink-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Spinner /> : <><Send className="h-4 w-4" /> Submit Story</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
