import { useEffect, useState } from 'react';
import { HeartHandshake, Calendar, Plus, Clock, CheckCircle2, XCircle, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { MentorProfile, MentorSession } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function Mentorship() {
  const { user, profile } = useAuth();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [booking, setBooking] = useState({ scheduled_at: '', topic: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, s] = await Promise.all([
        supabase.from('mentor_profiles').select('*, profile:profiles!mentor_profiles_user_id_fkey(*)').eq('is_available', true),
        user ? supabase.from('mentor_sessions').select('*').or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`).order('scheduled_at', { ascending: false }) : Promise.resolve({ data: [] }),
      ]);
      setMentors((m.data as MentorProfile[]) ?? []);
      setSessions((s.data as MentorSession[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const bookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMentor) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('mentor_sessions').insert({
      mentor_id: selectedMentor.user_id,
      mentee_id: user.id,
      scheduled_at: booking.scheduled_at,
      topic: booking.topic,
      status: 'scheduled',
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setModalOpen(false);
      setBooking({ scheduled_at: '', topic: '' });
      const { data } = await supabase.from('mentor_sessions').select('*').or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`).order('scheduled_at', { ascending: false });
      setSessions((data as MentorSession[]) ?? []);
    }
  };

  if (loading) return <PageLoader />;

  const isMentor = profile?.role === 'mentor';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Mentorship</h1>
        <p className="mt-1 text-ink-500">
          {isMentor ? 'Manage your mentees and sessions' : 'Connect with experienced mentors'}
        </p>
      </div>

      {success && <Alert type="success" message="Session booked successfully!" />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink-900">
            {isMentor ? 'Your Mentee Sessions' : 'Available Mentors'}
          </h2>
          {isMentor ? (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="card p-8 text-center text-sm text-ink-500">No sessions scheduled.</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-50 text-primary-700">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-ink-900">{s.topic}</p>
                          <p className="text-sm text-ink-500">{formatDateTime(s.scheduled_at)}</p>
                        </div>
                      </div>
                      <Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'error' : 'primary'}>
                        {s.status}
                      </Badge>
                      {s.meeting_url && s.status === 'scheduled' && (
                        <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                          <Video className="h-4 w-4" /> Join on Teams
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {mentors.length === 0 ? (
                <p className="card p-8 text-center text-sm text-ink-500">No mentors available yet. Check back soon!</p>
              ) : (
                mentors.map((m) => (
                  <div key={m.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-ink-900">
                          {(m as { profile?: { full_name?: string } }).profile?.full_name ?? 'Mentor'}
                        </h3>
                        <p className="text-sm text-secondary-600">{m.industry}</p>
                        {m.bio && <p className="mt-2 text-sm text-ink-600 line-clamp-2">{m.bio}</p>}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.expertise.map((e) => (
                            <Badge key={e} variant="neutral">{e}</Badge>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedMentor(m); setModalOpen(true); setSuccess(false); }}
                        className="btn-primary text-sm"
                      >
                        <Plus className="h-4 w-4" /> Book
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink-900">My Sessions</h2>
          {sessions.length === 0 ? (
            <p className="card p-8 text-center text-sm text-ink-500">No sessions booked yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary-50 text-secondary-600">
                      {s.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : s.status === 'cancelled' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900">{s.topic}</p>
                      <p className="text-sm text-ink-500">{formatDateTime(s.scheduled_at)}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'error' : 'primary'}>
                      {s.status}
                    </Badge>
                    {s.meeting_url && s.status === 'scheduled' && (
                      <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                        <Video className="h-4 w-4" /> Join on Teams
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book a Mentorship Session">
        {error && <Alert type="error" message={error} className="mb-4" />}
        <form onSubmit={bookSession} className="space-y-4">
          <div>
            <label className="label">Topic *</label>
            <input className="input" required placeholder="e.g. Career transition advice" value={booking.topic} onChange={(e) => setBooking({ ...booking, topic: e.target.value })} />
          </div>
          <div>
            <label className="label">Date & Time *</label>
            <input type="datetime-local" className="input" required value={booking.scheduled_at} onChange={(e) => setBooking({ ...booking, scheduled_at: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Spinner /> : 'Book Session'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
