import { useCallback, useEffect, useState } from 'react';
import { Calendar, Download, ExternalLink, Plus, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MentorSession, Profile } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { exportToCSV, formatDateTime } from '@/lib/utils';
import { isTeamsUrl } from '@/lib/teams';

interface SessionRow extends MentorSession {
  mentor?: { full_name: string | null } | null;
  mentee?: { full_name: string | null } | null;
}

interface MentorOption extends Profile {
  availability?: string | null;
  is_available?: boolean;
}

const statusVariant: Record<MentorSession['status'], 'primary' | 'success' | 'error'> = {
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'error',
};

const emptyForm = {
  mentor_id: '',
  mentee_ids: [] as string[],
  scheduled_at: '',
  topic: '',
  meeting_url: '',
  notes: '',
};

export default function AdminSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [mentees, setMentees] = useState<Profile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const [sessionResult, mentorResult, menteeResult, mentorProfileResult] = await Promise.all([
      supabase
        .from('mentor_sessions')
        .select('*, mentor:profiles!mentor_sessions_mentor_id_fkey(full_name), mentee:profiles!mentor_sessions_mentee_id_fkey(full_name)')
        .order('scheduled_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'mentor').eq('is_suspended', false).order('full_name'),
      supabase.from('profiles').select('*').eq('role', 'intern').eq('is_suspended', false).order('full_name'),
      supabase.from('mentor_profiles').select('user_id, availability, is_available'),
    ]);

    setSessions((sessionResult.data as SessionRow[]) ?? []);
    const availabilityByMentor = new Map((mentorProfileResult.data ?? []).map((item) => [item.user_id, item]));
    setMentors(((mentorResult.data as Profile[]) ?? []).map((mentor) => ({ ...mentor, ...availabilityByMentor.get(mentor.id) })));
    setMentees((menteeResult.data as Profile[]) ?? []);
    setError(sessionResult.error?.message ?? mentorResult.error?.message ?? menteeResult.error?.message ?? mentorProfileResult.error?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assignSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.mentee_ids.length === 0) {
      setError('Select at least one mentee.');
      return;
    }
    if (form.mentee_ids.includes(form.mentor_id)) {
      setError('The mentor and mentees must be different users.');
      return;
    }
    if (!isTeamsUrl(form.meeting_url)) {
      setError('Enter a valid Microsoft Teams meeting URL.');
      return;
    }
    if (new Date(form.scheduled_at).getTime() <= Date.now()) {
      setError('Choose a session time in the future.');
      return;
    }

    setSubmitting(true);
    const { data: createdSessions, error: insertError } = await supabase.from('mentor_sessions').insert(
      form.mentee_ids.map((mentee_id) => ({
        mentor_id: form.mentor_id,
        mentee_id,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        topic: form.topic.trim(),
        meeting_url: form.meeting_url.trim(),
        notes: form.notes.trim() || null,
        status: 'scheduled',
      })),
    ).select('id');

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    const when = formatDateTime(new Date(form.scheduled_at).toISOString());
    const { error: notificationError } = await supabase.from('notifications').insert([
      { user_id: form.mentor_id, title: 'New Mentorship Session', body: `You have been assigned a mentorship session on ${when}: ${form.topic.trim()}`, type: 'mentorship' },
      ...form.mentee_ids.map((mentee_id) => ({ user_id: mentee_id, title: 'New Mentorship Session', body: `You have been assigned a mentorship session on ${when}: ${form.topic.trim()}`, type: 'mentorship' })),
    ]);

    const { data: invitationResult, error: invitationError } = await supabase.functions.invoke('send-session-invitations', {
      body: { session_ids: (createdSessions ?? []).map((session) => session.id) },
    });

    setSubmitting(false);
    setModalOpen(false);
    setForm(emptyForm);
    if (invitationError || !invitationResult?.success) {
      setSuccess(null);
      setError(`Session assigned, but email invitations could not be sent. ${invitationResult?.error ?? invitationError?.message ?? 'Please try again or contact support.'}`);
    } else if (notificationError) {
      setSuccess(`Email invitations sent to the mentor and ${form.mentee_ids.length} mentee${form.mentee_ids.length === 1 ? '' : 's'}. In-app notification delivery needs attention.`);
    } else {
      setSuccess(`Session assigned for ${form.mentee_ids.length} mentee${form.mentee_ids.length === 1 ? '' : 's'}. Email invitations and in-app notifications sent.`);
    }
    await load();
  };

  const handleExport = () => {
    exportToCSV('mentor-sessions', sessions.map((session) => ({
      Mentor: session.mentor?.full_name ?? '',
      Mentee: session.mentee?.full_name ?? '',
      Topic: session.topic,
      'Scheduled Date': formatDateTime(session.scheduled_at),
      'Teams URL': session.meeting_url ?? '',
      Status: session.status,
      Notes: session.notes ?? '',
    })));
  };

  const selectedMentor = mentors.find((mentor) => mentor.id === form.mentor_id);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Microsoft Teams Meetings</h1>
          <p className="text-sm text-ink-500">
            {sessions.length} total · {sessions.filter((session) => session.status === 'scheduled').length} scheduled
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-outline text-sm"><Download className="h-4 w-4" /> Export</button>
          <button onClick={() => { setError(null); setModalOpen(true); }} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Assign Session</button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Mentor</th>
                <th className="px-4 py-3 font-semibold">Mentee</th>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="px-4 py-3 font-semibold">Scheduled Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Microsoft Teams</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sessions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No mentor sessions found.</td></tr>
              ) : sessions.map((session) => (
                <tr key={session.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{session.mentor?.full_name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{session.mentee?.full_name ?? 'Unknown'}</td>
                  <td className="max-w-[220px] px-4 py-3 text-ink-600"><p className="line-clamp-2">{session.topic}</p></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-ink-600"><Calendar className="h-3.5 w-3.5" />{formatDateTime(session.scheduled_at)}</span></td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[session.status]}><Video className="h-3 w-3" /> {session.status}</Badge></td>
                  <td className="px-4 py-3">
                    {session.meeting_url ? (
                      <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary-700 hover:underline">
                        Join meeting <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : <span className="text-ink-400">Not assigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title="Assign Mentorship Session" description="Pair one mentor with one or more mentees in the same Microsoft Teams session.">
        <form onSubmit={assignSession} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Mentor *</label><select className="input" required value={form.mentor_id} onChange={(e) => setForm({ ...form, mentor_id: e.target.value })}><option value="">Select mentor...</option>{mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.full_name ?? mentor.email}{mentor.is_available === false ? ' (unavailable)' : ''}</option>)}</select></div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="label mb-0">Mentees * ({form.mentee_ids.length} selected)</label>
                <div className="flex gap-2 text-xs">
                  <button type="button" className="font-medium text-primary-700 hover:underline" onClick={() => setForm({ ...form, mentee_ids: mentees.filter((mentee) => mentee.id !== form.mentor_id).map((mentee) => mentee.id) })}>Select all</button>
                  <button type="button" className="font-medium text-ink-500 hover:underline" onClick={() => setForm({ ...form, mentee_ids: [] })}>Clear</button>
                </div>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-ink-200 p-2" aria-label="Select mentees">
                {mentees.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-ink-500">No eligible mentees available.</p>
                ) : mentees.map((mentee) => {
                  const selected = form.mentee_ids.includes(mentee.id);
                  const disabled = mentee.id === form.mentor_id;
                  return (
                    <label key={mentee.id} className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-ink-50 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={(e) => setForm({
                          ...form,
                          mentee_ids: e.target.checked
                            ? [...form.mentee_ids, mentee.id]
                            : form.mentee_ids.filter((id) => id !== mentee.id),
                        })}
                      />
                      <span className="text-sm text-ink-900">{mentee.full_name ?? mentee.email}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-ink-500">Select one or multiple mentees for this session.</p>
            </div>
          </div>
          {selectedMentor && (
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm">
              <p className="font-medium text-ink-900">Mentor availability</p>
              <p className="mt-1 whitespace-pre-wrap text-ink-600">{selectedMentor.availability || 'No availability details provided.'}</p>
              {selectedMentor.is_available === false && <p className="mt-2 font-medium text-error-600">This mentor is not currently accepting sessions.</p>}
            </div>
          )}
          <div><label className="label">Topic *</label><input className="input" required maxLength={500} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
          <div><label className="label">Date & Time *</label><input type="datetime-local" className="input" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
          <div><label className="label">Microsoft Teams Meeting URL *</label><input type="url" className="input" required placeholder="https://teams.microsoft.com/l/meetup-join/..." value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} /></div>
          <div><label className="label">Notes</label><textarea className="input min-h-[90px]" maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button type="submit" disabled={submitting || mentors.length === 0 || mentees.length === 0 || form.mentee_ids.length === 0} className="btn-primary w-full">{submitting ? <Spinner /> : 'Assign Session'}</button>
        </form>
      </Modal>
    </div>
  );
}
