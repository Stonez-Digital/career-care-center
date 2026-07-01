import { useEffect, useState } from 'react';
import { Download, GraduationCap, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, Program } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, exportToCSV } from '@/lib/utils';

interface MenteeRow extends Profile {
  application?: { program?: Program | null; status?: string } | null;
  mentor?: { full_name: string | null } | null;
}

export default function AdminMentees() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<MenteeRow[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch students
      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (!students) {
        setLoading(false);
        return;
      }

      // Fetch applications for these students (with program info)
      const userIds = (students as Profile[]).map((s) => s.id);
      const { data: applications } = await supabase
        .from('applications')
        .select('id, user_id, program_id, status, program:programs(title)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Fetch mentor sessions to find assigned mentors
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('mentee_id, mentor:profiles!mentor_sessions_mentor_id_fkey(full_name)')
        .in('mentee_id', userIds);

      // Build a map of mentee_id -> latest application
      const appMap = new Map<string, any>();
      (applications ?? []).forEach((a: any) => {
        if (!appMap.has(a.user_id)) {
          appMap.set(a.user_id, a);
        }
      });

      // Build a map of mentee_id -> mentor name
      const mentorMap = new Map<string, string | null>();
      (sessions ?? []).forEach((s: any) => {
        if (!mentorMap.has(s.mentee_id)) {
          mentorMap.set(s.mentee_id, s.mentor?.full_name ?? null);
        }
      });

      // Only include students who have applications
      const menteeRows: MenteeRow[] = (students as Profile[])
        .filter((s) => appMap.has(s.id))
        .map((s) => ({
          ...s,
          application: appMap.get(s.id) ?? null,
          mentor: { full_name: mentorMap.get(s.id) ?? null },
        }));

      setMentees(menteeRows);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const handleExport = () => {
    exportToCSV(
      'mentees',
      mentees.map((m) => ({
        Name: m.full_name ?? '',
        Email: m.email,
        Phone: m.phone ?? '',
        Programme: m.application?.program?.title ?? '',
        'Application Status': m.application?.status ?? '',
        'Assigned Mentor': m.mentor?.full_name ?? '',
        Joined: formatDate(m.created_at),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Mentees</h1>
          <p className="text-sm text-ink-500">{mentees.length} students with applications</p>
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
                <th className="px-4 py-3 font-semibold">Mentee</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Programme</th>
                <th className="px-4 py-3 font-semibold">Mentor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {mentees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                    No mentees found.
                  </td>
                </tr>
              ) : (
                mentees.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary-50 text-sm font-bold text-secondary-600">
                          {m.full_name?.[0]?.toUpperCase() ?? 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">{m.full_name ?? 'Unknown'}</p>
                          <p className="truncate text-xs text-ink-500">{m.location ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-ink-600">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                        <span className="truncate">{m.email}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {m.application?.program?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {m.mentor?.full_name ?? (
                        <span className="text-ink-300">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.application?.status ? (
                        <Badge
                          variant={
                            m.application.status === 'approved'
                              ? 'success'
                              : m.application.status === 'pending'
                                ? 'warning'
                                : m.application.status === 'rejected'
                                  ? 'error'
                                  : 'primary'
                          }
                        >
                          {m.application.status.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(m.created_at)}</td>
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
