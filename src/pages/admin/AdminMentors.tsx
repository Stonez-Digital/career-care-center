import { useEffect, useState } from 'react';
import { Download, Mail, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, MentorProfile } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, exportToCSV } from '@/lib/utils';

interface MentorRow extends Profile {
  mentor_profile?: MentorProfile | null;
}

export default function AdminMentors() {
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<MentorRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, mentor_profile:mentor_profiles(*)')
        .eq('role', 'mentor')
        .order('created_at', { ascending: false });
      setMentors((data as MentorRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const handleExport = () => {
    exportToCSV(
      'mentors',
      mentors.map((m) => ({
        Name: m.full_name ?? '',
        Email: m.email,
        Phone: m.phone ?? '',
        Industry: m.mentor_profile?.industry ?? '',
        Expertise: (m.mentor_profile?.expertise ?? []).join('; '),
        Availability: m.mentor_profile?.availability ?? '',
        'Is Available': m.mentor_profile?.is_available ? 'Yes' : 'No',
        Location: m.location ?? '',
        Joined: formatDate(m.created_at),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Mentors</h1>
          <p className="text-sm text-ink-500">{mentors.length} mentors</p>
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
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Industry</th>
                <th className="px-4 py-3 font-semibold">Expertise</th>
                <th className="px-4 py-3 font-semibold">Availability</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {mentors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                    No mentors found.
                  </td>
                </tr>
              ) : (
                mentors.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-sm font-bold text-accent-600">
                          {m.full_name?.[0]?.toUpperCase() ?? 'M'}
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
                      {m.mentor_profile?.industry ?? '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {m.mentor_profile?.expertise && m.mentor_profile.expertise.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.mentor_profile.expertise.map((e) => (
                            <Badge key={e} variant="neutral">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.mentor_profile?.availability ? (
                        <span className="flex items-center gap-1.5 text-ink-600">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          {m.mentor_profile.availability}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {m.mentor_profile?.is_available ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="neutral">Unavailable</Badge>
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
