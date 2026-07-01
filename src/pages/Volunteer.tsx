import { useState } from 'react';
import { Heart, Send, CheckCircle2, Users, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

const benefits = [
  { icon: Users, title: 'Build Your Network', desc: 'Connect with professionals and like-minded changemakers across Nigeria.' },
  { icon: Clock, title: 'Flexible Commitment', desc: 'Choose opportunities that fit your schedule and availability.' },
  { icon: Heart, title: 'Make an Impact', desc: 'Directly contribute to empowering the next generation of Nigerian leaders.' },
  { icon: MapPin, title: 'Remote & On-site', desc: 'Volunteer from anywhere in Nigeria or join us at events nationwide.' },
];

export default function Volunteer() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '', availability: '', location: '', motivation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('volunteers').insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      availability: form.availability,
      location: form.location,
      motivation: form.motivation,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', skills: '', availability: '', location: '', motivation: '' });
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Volunteer"
        title="Volunteer With CCC"
        description="Share your time and skills to empower young Nigerians. Be part of a movement that's building the future of our nation."
      />

      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Why Volunteer</span>
            <h2 className="mt-3 heading-2">Benefits of Volunteering</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="card p-6 text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-700">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold text-ink-900">{b.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink-100/50">
        <div className="container-narrow">
          <div className="card p-8">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
                <h2 className="mt-4 heading-3">Application Received!</h2>
                <p className="mt-2 text-ink-600">Thank you for your interest in volunteering. Our team will review your application and reach out soon.</p>
                <button onClick={() => setSuccess(false)} className="btn-ghost mt-6">Submit Another Application</button>
              </div>
            ) : (
              <>
                <h2 className="heading-3">Volunteer Application</h2>
                <p className="mt-2 text-sm text-ink-600">Fill out the form below to join our volunteer community.</p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  {error && <Alert type="error" message={error} />}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Full Name *</label>
                      <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input className="input" required placeholder="+234..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Location *</label>
                      <input className="input" required placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Skills (comma-separated) *</label>
                    <input className="input" required placeholder="e.g. Graphic Design, Public Speaking, Mentoring" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Availability *</label>
                    <select className="input" required value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Evenings">Evenings</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Motivation *</label>
                    <textarea className="input min-h-[120px]" required placeholder="Why do you want to volunteer with CCC?" value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? <Spinner /> : <><Send className="h-4 w-4" /> Submit Application</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
