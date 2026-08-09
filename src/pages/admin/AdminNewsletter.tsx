import { useEffect, useState } from 'react';
import { Mail, Download, Trash2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NewsletterSubscriber } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import Modal from '@/components/Modal';
import { formatDate, exportToCSV } from '@/lib/utils';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsletterSubscriber | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    if (error) setError(error.message);
    setSubscribers((data as NewsletterSubscriber[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = subscribers.filter((s) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => s.is_active).length;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', confirmDelete.id);
    setDeleting(null);
    setConfirmDelete(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSubscribers((prev) => prev.filter((s) => s.id !== confirmDelete.id));
  };

  const handleExport = () => {
    exportToCSV('newsletter-subscribers', filtered.map((s) => ({ email: s.email, subscribed_at: formatDate(s.subscribed_at), active: s.is_active })));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Newsletter Subscribers</h1>
          <p className="mt-1 text-sm text-ink-500">Manage email subscribers and export lists.</p>
        </div>
        <button onClick={handleExport} className="btn-outline">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm font-medium text-ink-500">Total Subscribers</p>
          <p className="mt-2 font-heading text-3xl font-bold text-ink-900">{subscribers.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-ink-500">Active</p>
          <p className="mt-2 font-heading text-3xl font-bold text-success-600">{activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm font-medium text-ink-500">Inactive</p>
          <p className="mt-2 font-heading text-3xl font-bold text-ink-400">{subscribers.length - activeCount}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input className="input pl-11" placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-sm text-ink-500">No subscribers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-ink-50/50">
                    <td className="px-4 py-3 font-medium text-ink-900">{s.email}</td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(s.subscribed_at)}</td>
                    <td className="px-4 py-3">
                      {s.is_active ? (
                        <Badge variant="success"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</span></Badge>
                      ) : (
                        <Badge variant="neutral"><span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Inactive</span></Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-error-500 transition-colors hover:bg-error-50"
                        aria-label="Delete subscriber"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Subscriber">
        <p className="text-sm text-ink-600">
          Are you sure you want to remove <span className="font-semibold text-ink-900">{confirmDelete?.email}</span> from the newsletter?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={handleDelete} disabled={!!deleting} className="btn-error">
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
