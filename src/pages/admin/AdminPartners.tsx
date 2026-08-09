import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, Download, ExternalLink, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reportMutationError } from '@/lib/mutations';
import type { Partner } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, exportToCSV } from '@/lib/utils';

const emptyForm = {
  name: '',
  organization: '',
  email: '',
  partnership_type: '',
  category: '',
  website: '',
  logo_url: '',
  is_featured: false,
  message: '',
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    setPartners((data as Partner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
    setError(null);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name,
      organization: p.organization,
      email: p.email,
      partnership_type: p.partnership_type,
      category: p.category ?? '',
      website: p.website ?? '',
      logo_url: p.logo_url ?? '',
      is_featured: p.is_featured,
      message: p.message,
    });
    setModal(true);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      organization: form.organization,
      email: form.email,
      partnership_type: form.partnership_type,
      category: form.category || null,
      website: form.website || null,
      logo_url: form.logo_url || null,
      is_featured: form.is_featured,
      message: form.message,
    };
    const { error } = editing
      ? await supabase.from('partners').update(payload).eq('id', editing.id)
      : await supabase.from('partners').insert(payload);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setModal(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this partner? This cannot be undone.')) return;
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (reportMutationError('delete this partner', error)) return;
    load();
  };

  const handleExport = () => {
    exportToCSV(
      'partners',
      partners.map((p) => ({
        Name: p.name,
        Organization: p.organization,
        Email: p.email,
        'Partnership Type': p.partnership_type,
        Category: p.category ?? '',
        Website: p.website ?? '',
        'Logo URL': p.logo_url ?? '',
        Featured: p.is_featured ? 'Yes' : 'No',
        Message: p.message,
        'Created At': formatDate(p.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Partners</h1>
          <p className="text-sm text-ink-500">
            {partners.length} partners · {partners.filter((p) => p.is_featured).length} featured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={openNew} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New Partner
          </button>
        </div>
      </div>

      {/* Partner cards grid */}
      {partners.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No partners yet. Add your first partner.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.organization}
                      loading="lazy"
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-secondary-50 font-bold text-secondary-600">
                      {p.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{p.name}</p>
                    <p className="truncate text-sm text-ink-500">{p.organization}</p>
                  </div>
                </div>
                {p.is_featured && (
                  <Badge variant="accent">
                    <Star className="h-3 w-3" /> Featured
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.category && <Badge variant="secondary">{p.category}</Badge>}
                <Badge variant="primary">{p.partnership_type}</Badge>
              </div>

              {p.message && (
                <p className="mt-3 line-clamp-3 text-sm text-ink-600">{p.message}</p>
              )}

              <div className="mt-3 space-y-1 text-sm text-ink-500">
                <p className="truncate">{p.email}</p>
                {p.website && (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> <span className="truncate">{p.website}</span>
                  </a>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-ink-100 pt-3">
                <button onClick={() => openEdit(p)} className="btn-outline text-sm">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="btn-outline text-sm text-error-600 hover:bg-error-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Partner' : 'New Partner'} size="lg">
        <form onSubmit={save} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <label className="label">Organization *</label>
              <input
                className="input"
                required
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                placeholder="Organization name"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="label">Partnership Type *</label>
              <input
                className="input"
                required
                value={form.partnership_type}
                onChange={(e) => setForm({ ...form, partnership_type: e.target.value })}
                placeholder="e.g. Sponsor, Strategic"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Corporate, NGO"
              />
            </div>
            <div>
              <label className="label">Website</label>
              <input
                className="input"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input
                className="input"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[80px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Partnership message or notes..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Feature this partner
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : (
              <>
                <Save className="h-4 w-4" /> Save
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
