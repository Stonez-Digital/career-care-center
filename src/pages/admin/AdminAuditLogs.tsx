import { useEffect, useState } from 'react';
import { History, Search, Download, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDate, exportToCSV, timeAgo } from '@/lib/utils';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    setLogs((data as AuditLog[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const actions = ['all', ...Array.from(new Set(logs.map((l) => l.action)))];

  const filtered = logs.filter((l) => {
    const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || (l.details ?? '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const handleExport = () => {
    exportToCSV('audit-logs', filtered.map((l) => ({ action: l.action, entity_type: l.entity_type ?? '', entity_id: l.entity_id ?? '', details: l.details ?? '', created_at: formatDate(l.created_at) })));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-ink-500">Track all administrative actions and system events.</p>
        </div>
        <button onClick={handleExport} className="btn-outline">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input className="input pl-11" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <select className="input pl-11" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              {actions.map((a) => (
                <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm text-ink-500">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <Badge variant="primary">{l.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {l.entity_type ? `${l.entity_type}${l.entity_id ? ` #${l.entity_id.slice(0, 8)}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-ink-500">{l.details ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-500" title={formatDate(l.created_at)}>{timeAgo(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
