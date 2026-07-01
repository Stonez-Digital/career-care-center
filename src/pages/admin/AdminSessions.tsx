import { useEffect, useState } from 'react';
import { Download, Video, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MentorSession } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDateTime, exportToCSV } from '@/lib/utils';

interface SessionRow extends MentorSession {
  mentor?: { full_name: string | null } | null;
  mentee?: { full_name: string | null } | null;
}

const statusVariant: Record<MentorSession['status'], 'primary' | 'success' | 'error'> = {
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'error',
};

export default function AdminSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('mentor_sessions')
        .select(
          '*, mentor:profiles!mentor_sessions_mentor_id_fkey(full_name), mentee:profiles!mentor_sessions_mentee_id_fkey(full_name)'
        )
        .order('scheduled_at', { ascending: false });
      setSessions((data as SessionRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const handleExport = () => {
    exportToCSV(
      'mentor-sessions',
      sessions.map((s) => ({
        Mentor: s.mentor?.full_name ?? '',
        Mentee: s.mentee?.full_name ?? '',
        Topic: s.topic,
        'Scheduled Date': formatDateTime(s.scheduled_at),
        Status: s.status,
        Notes: s.notes ?? '',
        'Created At': formatDateTime(s.created_at),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Mentor Sessions</h1>
          <p className="text-sm text-ink-500">
            {sessions.length} total · {sessions.filter((s) => s.status === 'scheduled').length} scheduled
          </p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Table */}
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
                <th className="px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                    No mentor sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-xs font-bold text-accent-600">
                          {s.mentor?.full_name?.[0]?.toUpperCase() ?? 'M'}
                        </div>
                        <span className="font-medium text-ink-900">
                          {s.mentor?.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary-50 text-xs font-bold text-secondary-600">
                          {s.mentee?.full_name?.[0]?.toUpperCase() ?? 'S'}
                        </div>
                        <span className="font-medium text-ink-900">
                          {s.mentee?.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="line-clamp-2 text-ink-600">{s.topic}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-ink-600">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                        {formatDateTime(s.scheduled_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[s.status]}>
                        <Video className="h-3 w-3" /> {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {s.notes ? (
                        <p className="line-clamp-2 text-ink-600">{s.notes}</p>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
