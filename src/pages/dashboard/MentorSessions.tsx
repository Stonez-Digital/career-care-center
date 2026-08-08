import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { MentorSession } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { formatDateTime } from '@/lib/utils';

interface SessionRow extends MentorSession {
  mentee?: { full_name: string | null; email: string } | null;
}

export default function MentorSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from('mentor_sessions')
      .select('*, mentee:profiles!mentor_sessions_mentee_id_fkey(full_name, email)')
      .eq('mentor_id', user.id)
      .order('scheduled_at', { ascending: true })
      .then(({ data, error: loadError }) => {
        setSessions((data as SessionRow[]) ?? []);
        setError(loadError?.message ?? null);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Mentor Sessions</h1>
        <p className="mt-1 text-sm text-ink-500">Microsoft Teams sessions assigned to you by an administrator.</p>
      </div>
      {error && <Alert type="error" message={error} />}
      {sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <Video className="mx-auto h-8 w-8 text-primary-600" />
          <p className="mt-3 font-medium text-ink-900">No sessions assigned</p>
          <p className="mt-1 text-sm text-ink-500">New assignments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <article key={session.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold text-ink-900">{session.topic}</h2>
                    <Badge variant={session.status === 'completed' ? 'success' : session.status === 'cancelled' ? 'error' : 'primary'}>{session.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">Intern: {session.mentee?.full_name ?? session.mentee?.email ?? 'Assigned intern'}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><Calendar className="h-4 w-4" /> {formatDateTime(session.scheduled_at)}</p>
                  {session.notes && <p className="mt-2 text-sm text-ink-600">{session.notes}</p>}
                </div>
                {session.meeting_url && session.status === 'scheduled' && (
                  <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 text-sm">
                    <Video className="h-4 w-4" /> Join Teams <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
