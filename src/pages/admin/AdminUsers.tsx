import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, Ban, CheckCircle2, Trash2, Download, Mail, Users, RotateCcw, Send, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import { formatDate, cn, exportToCSV } from '@/lib/utils';

const roleVariant: Record<string, 'primary' | 'secondary' | 'accent' | 'neutral'> = {
  super_admin: 'primary', admin: 'primary', intern: 'secondary', mentor: 'accent', volunteer: 'neutral',
};

type BroadcastAudience = 'all' | 'active' | UserRole;

const audienceLabels: Record<BroadcastAudience, string> = {
  all: 'All registered users', active: 'Active users only', intern: 'Interns',
  volunteer: 'Volunteers', mentor: 'Mentors', admin: 'Administrators', super_admin: 'Super administrators',
};

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.app_metadata?.role === 'super_admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') ?? 'all';
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<BroadcastAudience>('active');
  const [previewingBroadcast, setPreviewingBroadcast] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setRoleFilter(searchParams.get('role') ?? 'all');
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const { data, error: loadError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (loadError) setError(`Users could not be loaded: ${loadError.message}`);
      setUsers((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const audienceCount = users.filter((candidate) => {
    if (broadcastAudience === 'all') return true;
    if (broadcastAudience === 'active') return !candidate.is_suspended;
    return candidate.role === broadcastAudience;
  }).length;

  const changeRole = async (id: string, role: UserRole) => {
    setError(null);
    const { data, error: requestError } = await supabase.functions.invoke('admin-update-user-role', { body: { user_id: id, role } });
    if (requestError) setError(requestError.message);
    else if (data?.error) setError(data.error);
    else {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
      setViewing((prev) => prev?.id === id ? { ...prev, role } : prev);
    }
  };

  const toggleSuspend = async (u: Profile) => {
    setError(null);
    const { error } = await supabase.from('profiles').update({ is_suspended: !u.is_suspended }).eq('id', u.id);
    if (error) setError(error.message);
    else setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_suspended: !p.is_suspended } : p));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this user account? This cannot be undone.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) setError(error.message);
    else setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleExport = () => {
    exportToCSV('users', filtered.map((u) => ({
      Name: u.full_name ?? '', Email: u.email, Role: u.role,
      Phone: u.phone ?? '', Location: u.location ?? '', Suspended: u.is_suspended ? 'Yes' : 'No',
      Joined: formatDate(u.created_at),
    })));
  };

  const deliverBroadcast = async (test = false) => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;
    setError(null);
    setNotice(null);
    if (test) setSendingTest(true);
    else setSendingBroadcast(true);
    const { data, error: requestError } = await supabase.functions.invoke('send-user-broadcast', {
      body: {
        subject: broadcastSubject.trim(),
        message: broadcastMessage.trim(),
        audience: broadcastAudience,
        test,
        request_id: crypto.randomUUID(),
      },
    });
    if (test) setSendingTest(false);
    else setSendingBroadcast(false);
    if (requestError || data?.error) {
      setError(data?.error ?? requestError?.message ?? 'Unable to send the email.');
      return;
    }
    if (test) {
      setNotice(`Test email sent to ${data.recipient}.`);
      return;
    }
    setNotice(`Email sent to ${data.sent} ${data.sent === 1 ? 'user' : 'users'}.`);
    setShowBroadcast(false);
    setPreviewingBroadcast(false);
    setBroadcastSubject('');
    setBroadcastMessage('');
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setSearchParams({});
    setPage(0);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">User Management</h1>
          <p className="text-sm text-ink-500">
            {filtered.length === users.length ? `${users.length} total users` : `${filtered.length} shown · ${users.length} total users`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && <button onClick={() => { setError(null); setNotice(null); setPreviewingBroadcast(false); setShowBroadcast(true); }} className="btn-primary text-sm"><Mail className="h-4 w-4" /> Email Users</button>}
          <button onClick={handleExport} className="btn-outline text-sm"><Download className="h-4 w-4" /> Export</button>
        </div>
      </div>

      {(search || roleFilter !== 'all') && (
        <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline">
          <RotateCcw className="h-4 w-4" /> Clear filters
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-10" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select className="input sm:w-48" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setSearchParams(e.target.value === 'all' ? {} : { role: e.target.value }); setPage(0); }}>
          <option value="all">All Roles</option>
          <option value="intern">Interns</option>
          <option value="volunteer">Volunteers</option>
          <option value="mentor">Mentors</option>
          <option value="admin">Administrators</option>
          <option value="super_admin">Super Administrators</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="hidden px-4 py-3 lg:table-cell">Location</th>
                <th className="hidden px-4 py-3 sm:table-cell">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {paginated.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                        {u.full_name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">{u.full_name ?? 'Unknown'}</p>
                        <p className="truncate text-xs text-ink-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[u.role]}>
                      {(u.role === 'admin' || u.role === 'super_admin') && <ShieldCheck className="mr-1 h-3 w-3" />}
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-600 lg:table-cell">{u.location ?? '—'}</td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_suspended ? <Badge variant="error">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewing(u)} className="text-sm font-semibold text-primary-700 hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400"><Users className="h-6 w-6" /></div>
            <p className="font-semibold text-ink-800">No {roleFilter === 'all' ? 'users' : audienceLabels[roleFilter as UserRole].toLowerCase()} found</p>
            <p className="mt-1 text-sm text-ink-500">Try another search or clear the current filters.</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
            <p className="text-xs text-ink-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Manage User Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Manage User" size="md">
        {viewing && (
          <div className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-2xl font-bold text-primary-700">
                {viewing.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-ink-900">{viewing.full_name ?? 'Unknown'}</p>
                <p className="text-sm text-ink-500">{viewing.email}</p>
                <p className="text-xs text-ink-400">Joined {formatDate(viewing.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-ink-50 p-4 text-sm">
              <div><p className="text-xs font-semibold uppercase text-ink-400">Phone</p><p className="text-ink-900">{viewing.phone ?? '—'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-ink-400">Location</p><p className="text-ink-900">{viewing.location ?? '—'}</p></div>
              <div className="col-span-2"><p className="text-xs font-semibold uppercase text-ink-400">Bio</p><p className="text-ink-900">{viewing.bio ?? '—'}</p></div>
            </div>

            <div>
              <label className="label">Role</label>
              <select className="input" value={viewing.role} onChange={(e) => changeRole(viewing.id, e.target.value as UserRole)} disabled={!isSuperAdmin || viewing.id === user?.id}>
                <option value="intern">Intern</option>
                <option value="volunteer">Volunteer</option>
                <option value="mentor">Mentor</option>
                {isSuperAdmin && <option value="admin">Administrator</option>}
                {isSuperAdmin && <option value="super_admin">Super Administrator</option>}
              </select>
              {viewing.id === user?.id && <p className="mt-1 text-xs text-ink-400">You cannot change your own role.</p>}
            </div>

            <div className="flex gap-2">
              <button onClick={() => toggleSuspend(viewing)} disabled={viewing.role === 'super_admin' && !isSuperAdmin} className={cn('flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50', viewing.is_suspended ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-warning-50 text-warning-700 hover:bg-warning-100')}>
                {viewing.is_suspended ? <><CheckCircle2 className="mr-1.5 inline h-4 w-4" /> Activate</> : <><Ban className="mr-1.5 inline h-4 w-4" /> Suspend</>}
              </button>
              <button onClick={() => { remove(viewing.id); setViewing(null); }} disabled={viewing.id === user?.id || (viewing.role === 'super_admin' && !isSuperAdmin)} className="flex-1 rounded-xl bg-error-50 px-4 py-2.5 text-sm font-semibold text-error-700 transition-all hover:bg-error-100 disabled:opacity-50">
                <Trash2 className="mr-1.5 inline h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showBroadcast} onClose={() => !sendingBroadcast && !sendingTest && setShowBroadcast(false)} title={previewingBroadcast ? 'Review Broadcast' : 'Email Users'} size="md">
        <div className="space-y-4">
          {error && <Alert type="error" message={error} />}
          {notice && <Alert type="success" message={notice} />}
          <Alert type="warning" message={previewingBroadcast ? `Confirm this message before sending it to ${audienceCount} ${audienceCount === 1 ? 'recipient' : 'recipients'}.` : 'Only super administrators can send broadcasts. Start with a test email and review the message before delivery.'} />
          {!previewingBroadcast && <div>
            <label className="label" htmlFor="broadcast-audience">Recipients</label>
            <select id="broadcast-audience" className="input" value={broadcastAudience} onChange={(event) => setBroadcastAudience(event.target.value as BroadcastAudience)} disabled={sendingBroadcast || sendingTest}>
              {Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink-500">{audienceCount} matching {audienceCount === 1 ? 'profile' : 'profiles'}</p>
          </div>}
          <div>
            <label className="label" htmlFor="broadcast-subject">Subject</label>
            <input
              id="broadcast-subject"
              className="input"
              value={broadcastSubject}
              onChange={(event) => setBroadcastSubject(event.target.value)}
              maxLength={150}
              placeholder="Important update from Career Care Center"
              disabled={sendingBroadcast || sendingTest || previewingBroadcast}
            />
          </div>
          <div>
            <label className="label" htmlFor="broadcast-message">Message</label>
            <textarea
              id="broadcast-message"
              className="input min-h-48 resize-y"
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              maxLength={10000}
              placeholder="Write the email message..."
              disabled={sendingBroadcast || sendingTest || previewingBroadcast}
            />
            <p className="mt-1 text-right text-xs text-ink-400">{broadcastMessage.length}/10,000</p>
          </div>
          {previewingBroadcast && (
            <div className="rounded-xl border border-ink-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{audienceLabels[broadcastAudience]}</p>
              <p className="mt-2 font-heading text-lg font-semibold text-ink-900">{broadcastSubject}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-700">Hello [recipient name],{`\n\n`}{broadcastMessage}{`\n\n`}Kind regards,{`\n`}Career Care Center for Youth Development Initiative</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => previewingBroadcast ? setPreviewingBroadcast(false) : setShowBroadcast(false)} disabled={sendingBroadcast || sendingTest}>{previewingBroadcast ? 'Back' : 'Cancel'}</button>
            {!previewingBroadcast && <button type="button" className="btn-outline" onClick={() => deliverBroadcast(true)} disabled={sendingTest || sendingBroadcast || !broadcastSubject.trim() || !broadcastMessage.trim()}><Send className="h-4 w-4" /> {sendingTest ? 'Sending…' : 'Send Test'}</button>}
            {!previewingBroadcast && <button type="button" className="btn-primary" onClick={() => setPreviewingBroadcast(true)} disabled={!audienceCount || !broadcastSubject.trim() || !broadcastMessage.trim()}><Eye className="h-4 w-4" /> Review</button>}
            {previewingBroadcast && <button type="button" className="btn-primary" onClick={() => deliverBroadcast(false)} disabled={sendingBroadcast || !audienceCount}><Mail className="h-4 w-4" /> {sendingBroadcast ? 'Sending…' : `Confirm & Send to ${audienceCount}`}</button>}
          </div>
          <p className="text-xs text-ink-500">Test and broadcast deliveries are recorded in <Link to="/admin/audit-logs" className="font-semibold text-primary-700 hover:underline">Audit Logs</Link>.</p>
        </div>
      </Modal>
    </div>
  );
}
