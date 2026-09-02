import { useEffect, useState } from 'react';
import { Download, LogIn, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LoginActivity } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { exportToCSV, formatDate, timeAgo } from '@/lib/utils';

function deviceSummary(userAgent: string | null) {
  if (!userAgent) return 'Unknown device';
  const browser = userAgent.includes('Edg/') ? 'Edge'
    : userAgent.includes('Chrome/') ? 'Chrome'
      : userAgent.includes('Firefox/') ? 'Firefox'
        : userAgent.includes('Safari/') ? 'Safari' : 'Browser';
  const device = /Android/i.test(userAgent) ? 'Android'
    : /iPhone|iPad/i.test(userAgent) ? 'iPhone/iPad'
      : /Windows/i.test(userAgent) ? 'Windows'
        : /Macintosh/i.test(userAgent) ? 'Mac' : /Linux/i.test(userAgent) ? 'Linux' : 'device';
  return `${browser} on ${device}`;
}

export default function AdminLoginActivity() {
  const [activity, setActivity] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    supabase
      .from('login_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError(`Login activity could not be loaded: ${loadError.message}`);
        setActivity((data as LoginActivity[]) ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? activity.filter((item) => [item.full_name, item.email, item.role, item.portal, item.ip_address, deviceSummary(item.user_agent)]
      .some((value) => value?.toLowerCase().includes(query)))
    : activity;

  const download = () => exportToCSV('login-activity', filtered.map((item) => ({
    Name: item.full_name ?? '', Email: item.email, Role: item.role ?? '', Portal: item.portal,
    IP: item.ip_address ?? '', Device: deviceSummary(item.user_agent), SignedInAt: formatDate(item.created_at),
  })));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Login Activity</h1>
          <p className="mt-1 text-sm text-ink-500">The latest {activity.length} successful sign-ins. Records are retained for up to 90 days.</p>
        </div>
        <button type="button" onClick={download} className="btn-outline"><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, role, device, or IP…" />
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <LogIn className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 font-semibold text-ink-800">No login activity found</p>
          <p className="mt-1 text-sm text-ink-500">New successful sign-ins will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3">Device</th><th className="px-4 py-3">IP address</th><th className="px-4 py-3">Signed in</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-50">{filtered.map((item) => (
                <tr key={item.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3"><p className="font-medium text-ink-900">{item.full_name ?? 'Unknown'}</p><p className="text-xs text-ink-500">{item.email}</p></td>
                  <td className="px-4 py-3"><Badge variant="neutral">{item.role?.replace('_', ' ') ?? 'Unknown'}</Badge></td>
                  <td className="px-4 py-3 capitalize text-ink-600">{item.portal}</td>
                  <td className="px-4 py-3 text-ink-600">{deviceSummary(item.user_agent)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{item.ip_address ?? 'Unavailable'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-500" title={formatDate(item.created_at)}>{timeAgo(item.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
