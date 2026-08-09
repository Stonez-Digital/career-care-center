import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, Download, FileText, Video, BookOpen, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reportMutationError } from '@/lib/mutations';
import type { Resource, ResourceType, ResourceCategory } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, exportToCSV } from '@/lib/utils';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES, RESOURCE_TYPES } from '@/lib/media';

const emptyForm = {
  title: '',
  description: '',
  category: 'Career Development' as ResourceCategory,
  type: 'pdf' as ResourceType,
  url: '',
  cover_image_url: '',
  duration: '',
};

const categories: ResourceCategory[] = [
  'Career Development',
  'Entrepreneurship',
  'Leadership',
  'Employability',
  'CV Writing',
  'Interview Preparation',
];

const typeIcon: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  video: Video,
  article: BookOpen,
};

const typeVariant: Record<ResourceType, 'primary' | 'secondary' | 'accent'> = {
  pdf: 'primary',
  video: 'secondary',
  article: 'accent',
};

export default function AdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    setResources((data as Resource[]) ?? []);
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

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description,
      category: r.category,
      type: r.type,
      url: r.url,
      cover_image_url: r.cover_image_url ?? '',
      duration: r.duration ?? '',
    });
    setModal(true);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      type: form.type,
      url: form.url,
      cover_image_url: form.cover_image_url || null,
      duration: form.duration || null,
    };
    const { error } = editing
      ? await supabase.from('resources').update(payload).eq('id', editing.id)
      : await supabase.from('resources').insert({ ...payload, downloads: 0 });
    setSaving(false);
    if (error) setError(error.message);
    else {
      setModal(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (reportMutationError('delete this resource', error)) return;
    load();
  };

  const handleExport = () => {
    exportToCSV(
      'resources',
      resources.map((r) => ({
        Title: r.title,
        Description: r.description,
        Category: r.category,
        Type: r.type,
        URL: r.url,
        'Cover Image URL': r.cover_image_url ?? '',
        Duration: r.duration ?? '',
        Downloads: r.downloads,
        'Created At': formatDate(r.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Resources</h1>
          <p className="text-sm text-ink-500">
            {resources.length} resources · {resources.reduce((sum, r) => sum + r.downloads, 0)} total downloads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={openNew} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New Resource
          </button>
        </div>
      </div>

      {/* Resource cards grid */}
      {resources.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No resources yet. Add your first resource.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const Icon = typeIcon[r.type];
            return (
              <div key={r.id} className="card overflow-hidden">
                {r.cover_image_url ? (
                  <img
                    src={r.cover_image_url}
                    alt={r.title}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-32 w-full place-items-center bg-ink-50 text-ink-300">
                    <Icon className="h-10 w-10" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={typeVariant[r.type]}>
                      <Icon className="h-3 w-3" /> {r.type.toUpperCase()}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-2 font-heading font-semibold text-ink-900">{r.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{r.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <Badge variant="neutral">{r.category}</Badge>
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" /> {r.downloads}
                    </span>
                    {r.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {r.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Resource' : 'New Resource'} size="lg">
        <form onSubmit={save} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Resource title"
            />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea
              className="input min-h-[80px]"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the resource..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ResourceCategory })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type *</label>
              <select
                className="input"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="label">URL *</label>
              <MediaUpload
                bucket="resource-media"
                folder="resources"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
                allowedTypes={RESOURCE_TYPES}
                maxBytes={50 * 1024 * 1024}
                label="Upload File"
                onUploaded={(url) => setForm({ ...form, url })}
                onError={setError}
              />
            </div>
            <input
              className="input"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Cover Image URL</label>
                <MediaUpload
                  bucket="resource-media"
                  folder="covers"
                  accept="image/jpeg,image/png,image/webp"
                  allowedTypes={IMAGE_TYPES}
                  maxBytes={5 * 1024 * 1024}
                  label="Upload Cover"
                  onUploaded={(cover_image_url) => setForm({ ...form, cover_image_url })}
                  onError={setError}
                />
              </div>
              <input
                className="input"
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <input
                className="input"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 15 min, 2 hours"
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
