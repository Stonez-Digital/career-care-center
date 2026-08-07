import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Star, Trash2, Edit, Save, StarOff, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Testimonial } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, cn, exportToCSV } from '@/lib/utils';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES } from '@/lib/media';

type Tab = 'all' | 'pending' | 'approved';

const emptyForm = {
  name: '',
  role: '',
  quote: '',
  rating: 5,
  image_url: '',
};

export default function AdminTestimonials() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('filter') as Tab) ?? 'all';
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    setItems((data as Testimonial[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setTab((searchParams.get('filter') as Tab) ?? 'all');
  }, [searchParams]);

  const toggleApprove = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ approved: !t.approved }).eq('id', t.id);
    load();
  };

  const toggleFeature = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ is_featured: !t.is_featured }).eq('id', t.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    load();
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      name: t.name,
      role: t.role,
      quote: t.quote,
      rating: t.rating,
      image_url: t.image_url ?? '',
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
      role: form.role,
      quote: form.quote,
      rating: Number(form.rating),
      image_url: form.image_url || null,
    };
    const { error } = editing
      ? await supabase.from('testimonials').update(payload).eq('id', editing.id)
      : await supabase.from('testimonials').insert({ ...payload, approved: false, is_featured: false });
    setSaving(false);
    if (error) setError(error.message);
    else {
      setModal(false);
      load();
    }
  };

  const handleExport = () => {
    exportToCSV(
      'testimonials',
      items.map((t) => ({
        Name: t.name,
        Role: t.role,
        Quote: t.quote,
        Rating: t.rating,
        Approved: t.approved ? 'Yes' : 'No',
        Featured: t.is_featured ? 'Yes' : 'No',
        'Image URL': t.image_url ?? '',
        'Created At': formatDate(t.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  const filtered =
    tab === 'all'
      ? items
      : tab === 'approved'
      ? items.filter((t) => t.approved)
      : items.filter((t) => !t.approved);

  const tabs: Tab[] = ['all', 'pending', 'approved'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Testimonials</h1>
          <p className="text-sm text-ink-500">
            {items.length} total · {items.filter((t) => !t.approved).length} pending approval ·{' '}
            {items.filter((t) => t.is_featured).length} featured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearchParams(t === 'all' ? {} : { filter: t });
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid of testimonial cards */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No testimonials found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={t.image_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0F4C81&color=fff`}
                    alt={t.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-ink-900">{t.name}</p>
                    <p className="text-sm text-ink-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={t.approved ? 'success' : 'warning'}>
                    {t.approved ? 'Approved' : 'Pending'}
                  </Badge>
                  {t.is_featured && <Badge variant="accent">Featured</Badge>}
                </div>
              </div>
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < t.rating ? 'fill-accent-400 text-accent-400' : 'text-ink-200'
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-600">"{t.quote}"</p>
              <p className="mt-2 text-xs text-ink-400">{formatDate(t.created_at)}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                <button
                  onClick={() => toggleApprove(t)}
                  className={t.approved ? 'btn-outline text-sm text-warning-600' : 'btn-secondary text-sm'}
                >
                  {t.approved ? (
                    <>
                      <X className="h-4 w-4" /> Unapprove
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => toggleFeature(t)}
                  className={t.is_featured ? 'btn-outline text-sm text-accent-600' : 'btn-outline text-sm'}
                >
                  {t.is_featured ? (
                    <>
                      <StarOff className="h-4 w-4" /> Unfeature
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4" /> Feature
                    </>
                  )}
                </button>
                <button onClick={() => openEdit(t)} className="btn-outline text-sm">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="btn-outline text-sm text-error-600 hover:bg-error-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Testimonial' : 'New Testimonial'} size="lg">
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
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <input
                className="input"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Program Graduate"
              />
            </div>
          </div>
          <div>
            <label className="label">Quote *</label>
            <textarea
              className="input min-h-[100px]"
              required
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              placeholder="The testimonial quote..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Rating *</label>
              <select
                className="input"
                required
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 1 ? 'star' : 'stars'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Image URL</label>
                <MediaUpload bucket="resource-media" folder="testimonials" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} label="Upload Image" onUploaded={(image_url) => setForm({ ...form, image_url })} onError={setError} />
              </div>
              <input
                className="input"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
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
