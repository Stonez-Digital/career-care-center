import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, ExternalLink, Video, XCircle } from 'lucide-react';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { PageLoader } from '@/components/Spinner';
import { useAuth } from '@/lib/auth';
import { supabase, type MentorSession } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import { isTeamsUrl } from '@/lib/teams';

interface SessionRow extends MentorSession {
  mentor?: { full_name: string | null; email: string } | null;
  mentee?: { full_name: string | null; email: string } | null;
}

export default function TeamMeetings() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    void supabase
      .from('mentor_sessions')
      .select('*, mentor:profiles!mentor_sessions_mentor_id_fkey(full_name, email), mentee:profiles!mentor_sessions_mentee_id_fkey(full_name, email)')
      .order('scheduled_at', { ascending: true })
      .then(({ data, error: loadError }) => {
        setSessions((data as SessionRow[]) ?? []);
        setError(loadError?.message ?? null);
        setLoading(false);
      });
  }, [user]);

  const { upcoming, previous } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: sessions.filter((session) => session.status === 'scheduled' && new Date(session.scheduled_at).getTime() >= now),
      previous: sessions.filter((session) => session.status !== 'scheduled' || new Date(session.scheduled_at).getTime() < now).reverse(),
    };
  }, [sessions]);

  if (loading) return <PageLoader />;

  const participantName = (session: SessionRow) => {
    const participant = session.mentor_id === user?.id ? session.mentee : session.mentor;
    return participant?.full_name ?? participant?.email ?? 'Career Care team member';
  };

  const meetingCard = (session: SessionRow) => {
    const meetingUrl = isTeamsUrl(session.meeting_url) ? session.meeting_url : null;
    const canJoin = session.status === 'scheduled' && meetingUrl !== null;
    return (
      <article key={session.id} className="card overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-ink-900">{session.topic}</h2>
              <Badge variant={session.status === 'completed' ? 'success' : session.status === 'cancelled' ? 'error' : 'primary'}>
                {session.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-ink-600">Meeting with {participantName(session)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <Calendar className="h-4 w-4" /> {formatDateTime(session.scheduled_at)}
            </p>
            {session.notes && <p className="mt-3 text-sm text-ink-600">{session.notes}</p>}
          </div>
          {canJoin ? (
            <a href={meetingUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 text-sm">
              <Video className="h-4 w-4" /> Join Microsoft Teams <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : session.status === 'scheduled' ? (
            <span className="text-sm font-medium text-warning-600">Waiting for meeting link</span>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl bg-[#0D2175] p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">Virtual meeting console</p>
            <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Microsoft Teams Meetings</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-100">View your scheduled Career Care sessions and join securely when it is time.</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Video className="h-8 w-8" />
          </div>
        </div>
      </section>

      {error && <Alert type="error" message={error} />}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          <h2 className="font-heading text-xl font-bold text-ink-900">Upcoming meetings</h2>
          <Badge variant="primary">{upcoming.length}</Badge>
        </div>
        {upcoming.length ? upcoming.map(meetingCard) : (
          <div className="card p-8 text-center">
            <Video className="mx-auto h-8 w-8 text-primary-600" />
            <p className="mt-3 font-medium text-ink-900">No upcoming meetings</p>
            <p className="mt-1 text-sm text-ink-500">Meetings assigned by an administrator will appear here.</p>
          </div>
        )}
      </section>

      {previous.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            {previous.some((session) => session.status === 'cancelled') ? <XCircle className="h-5 w-5 text-ink-500" /> : <CheckCircle2 className="h-5 w-5 text-success-700" />}
            <h2 className="font-heading text-xl font-bold text-ink-900">Previous meetings</h2>
            <Badge>{previous.length}</Badge>
          </div>
          {previous.map(meetingCard)}
        </section>
      )}
    </div>
  );
}
