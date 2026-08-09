import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Clock, Loader, Mail, Phone, Download, Search, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus, AdminNote } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/Spinner';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDate, cn, exportToCSV, timeAgo } from '@/lib/utils';

const statusConfig: Record<ApplicationStatus, { variant: 'warning' | 'primary' | 'success' | 'error'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { variant: 'warning', icon: Clock },
  under_review: { variant: 'primary', icon: Loader },
  approved: { variant: 'success', icon: Check },
  rejected: { variant: 'error', icon: X },
};

const filters: ('all' | ApplicationStatus)[] = ['all', 'pending', 'under_review', 'approved', 'rejected'];

export default function AdminApplications() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get('status') as ApplicationStatus | 'all') ?? 'all';
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>(initialFilter);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Application | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, program:programs(*), notes:admin_notes(*)')
      .order('created_at', { ascending: false });
    setApps((data as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFilter((searchParams.get('status') as ApplicationStatus | 'all') ?? 'all');
  }, [searchParams]);

  const loadNotes = async (applicationId: string) => {
    const { data } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });
    setNotes((data as AdminNote[]) ?? []);
  };

  const openReview = (a: Application) => {
    setViewing(a);
    setNewNote('');
    setError(null);
    loadNotes(a.id);
  };

  const addNote = async () => {
    if (!viewing || !newNote.trim()) return;
    setSavingNote(true);
    setError(null);
    const { error } = await supabase.from('admin_notes').insert({
      application_id: viewing.id,
      note: newNote.trim(),
      created_by: user?.id ?? null,
    });
    setSavingNote(false);
    if (error) {
      setError(error.message);
    } else {
      setNewNote('');
      loadNotes(viewing.id);
    }
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setUpdating(true);
    setError(null);
    const { error: updateError } = await supabase.from('applications').update({ status }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      setUpdating(false);
      return;
    }
    const { error: logError } = await supabase.from('application_status_logs').insert({
      application_id: id,
      status,
      changed_by: user?.id ?? null,
    });
    if (logError) setError(`Status updated, but the audit entry failed: ${logError.message}`);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setViewing((prev) => (prev?.id === id ? { ...prev, status } : prev));
    setUpdating(false);
  };

  const handleExport = () => {
    exportToCSV('applications', filtered.map((a) => ({
      Name: a.full_name,
      Email: a.email,
      Phone: a.phone,
      Gender: a.gender ?? '',
      'Date of Birth': a.date_of_birth ?? '',
      Institution: a.institution ?? '',
      Occupation: a.occupation ?? '',
      Programme: a.program?.title ?? '',
      Status: a.status.replace('_', ' '),
      'Applied Date': formatDate(a.created_at),
    })));
  };

  if (loading) return <PageLoader />;

  const filtered = apps.filter((a) => {
    const matchFilter = filter === 'all' || a.status === filter;
    const matchSearch =
      !search ||
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Applications</h1>
          <p className="text-sm text-ink-500">
            {apps.length} total · {apps.filter((a) => a.status === 'pending').length} pending
          </p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSearchParams(f === 'all' ? {} : { status: f });
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                filter === f ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              )}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Programme</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink-500">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const cfg = statusConfig[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{a.full_name}</p>
                        <p className="text-xs text-ink-500">{a.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{a.program?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant}>
                          <cfg.icon className="h-3 w-3" /> {a.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReview(a)}
                          className="text-sm font-semibold text-primary-700 hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Application Review" size="lg">
        {viewing && (
          <div className="space-y-5">
            {/* Applicant info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Full Name</p>
                <p className="text-ink-900">{viewing.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Email</p>
                <p className="flex items-center gap-1 text-ink-900">
                  <Mail className="h-3.5 w-3.5" /> {viewing.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Phone</p>
                <p className="flex items-center gap-1 text-ink-900">
                  <Phone className="h-3.5 w-3.5" /> {viewing.phone}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Gender</p>
                <p className="text-ink-900">{viewing.gender ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Date of Birth</p>
                <p className="text-ink-900">{viewing.date_of_birth ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Institution</p>
                <p className="text-ink-900">{viewing.institution ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Occupation</p>
                <p className="text-ink-900">{viewing.occupation ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Programme</p>
                <p className="text-ink-900">{viewing.program?.title ?? '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Motivation</p>
              <p className="mt-1 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">{viewing.motivation}</p>
            </div>

            {/* Internal notes */}
            <div className="border-t border-ink-100 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-ink-500" />
                <h4 className="font-heading text-sm font-semibold text-ink-900">Internal Notes</h4>
              </div>
              <div className="mb-3 space-y-2">
                {notes.length === 0 ? (
                  <p className="text-sm text-ink-400">No notes yet.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="rounded-xl bg-ink-50 p-3 text-sm">
                      <p className="text-ink-700">{n.note}</p>
                      <p className="mt-1 text-xs text-ink-400">{timeAgo(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Add an internal note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                />
                <button
                  onClick={addNote}
                  disabled={savingNote || !newNote.trim()}
                  className="btn-primary px-4 text-sm disabled:opacity-50"
                >
                  {savingNote ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Status + actions */}
            <div className="flex flex-col gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Badge variant={statusConfig[viewing.status].variant}>
                {viewing.status.replace('_', ' ')}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {updating && <Spinner className="h-4 w-4" />}
                {viewing.status !== 'pending' && (
                  <button
                    onClick={() => updateStatus(viewing.id, 'pending')}
                    className="btn-outline text-sm"
                  >
                    <Clock className="h-4 w-4" /> Pending
                  </button>
                )}
                {viewing.status !== 'under_review' && (
                  <button
                    onClick={() => updateStatus(viewing.id, 'under_review')}
                    className="btn-outline text-sm"
                  >
                    <Loader className="h-4 w-4" /> Under Review
                  </button>
                )}
                {viewing.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(viewing.id, 'approved')}
                    className="btn-primary text-sm"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                )}
                {viewing.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(viewing.id, 'rejected')}
                    className="btn-outline text-sm text-error-600 hover:bg-error-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
