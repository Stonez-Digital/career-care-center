import { useEffect, useState } from 'react';
import { Send, CheckCircle2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHero from '@/components/PageHero';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

export default function Apply() {
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState('');

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', gender: '', date_of_birth: '',
    institution: '', occupation: '', program_id: '', motivation: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('programs').select('id, title').eq('is_active', true).order('title');
      setPrograms((data as Program[]) ?? []);
    })();
    if (profile) {
      setForm((f) => ({ ...f, full_name: profile.full_name ?? '', email: profile.email ?? '' }));
    }
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.from('applications').insert({
      ...form,
      user_id: user?.id ?? null,
      status: 'pending',
    }).select('id').single();
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setRef(data?.id?.slice(0, 8).toUpperCase() ?? '');
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Apply"
        title="Start Your Application"
        description="Take the first step toward building a smarter future. Fill out the form below and our team will review your application."
      />

      <section className="section">
        <div className="container-narrow">
          {success ? (
            <div className="card p-10 text-center">
              <CheckCircle2 className="mx-auto h-20 w-20 text-success-500" />
              <h2 className="mt-6 heading-3">Application Submitted!</h2>
              <p className="mt-3 text-ink-600">
                Thank you for applying. Your application has been received and is now under review.
              </p>
              <div className="mx-auto mt-6 max-w-xs rounded-xl bg-primary-50 p-4">
                <p className="text-sm text-ink-500">Your Application Reference</p>
                <p className="font-heading text-2xl font-bold text-primary-700">CCC-{ref}</p>
              </div>
              <p className="mt-4 text-sm text-ink-500">
                {user ? 'Track your application status in your dashboard.' : 'Create an account to track your application status online.'}
              </p>
              {user ? (
                <a href="/dashboard/applications" className="btn-primary mt-6">Track Application</a>
              ) : (
                <a href="/signup" className="btn-primary mt-6">Create Account</a>
              )}
            </div>
          ) : (
            <div className="card p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-ink-900">Program Application Form</h2>
                  <p className="text-sm text-ink-500">All fields marked with * are required.</p>
                </div>
              </div>
              <form onSubmit={submit} className="space-y-5">
                {error && <Alert type="error" message={error} />}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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
                    <label className="label">Gender</label>
                    <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Institution</label>
                    <input className="input" placeholder="University or school" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Occupation</label>
                    <input className="input" placeholder="Intern / Graduate / Job seeker" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Program of Interest *</label>
                    <select className="input" required value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                      <option value="">Select a program...</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Motivation Statement *</label>
                  <textarea className="input min-h-[140px]" required placeholder="Tell us why you want to join this program and what you hope to achieve..." value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Spinner /> : <><Send className="h-4 w-4" /> Submit Application</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
