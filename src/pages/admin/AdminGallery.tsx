import { useCallback, useEffect, useState } from 'react';
import { Edit, Eye, EyeOff, Images, Plus, Save, Trash2, Video } from 'lucide-react';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import MediaUpload from '@/components/MediaUpload';
import Modal from '@/components/Modal';
import Spinner, { PageLoader } from '@/components/Spinner';
import { GALLERY_MEDIA_TYPES, IMAGE_TYPES, storagePathFromPublicUrl } from '@/lib/media';
import { reportMutationError } from '@/lib/mutations';
import { supabase } from '@/lib/supabase';
import type { GalleryMedia, GalleryMediaType } from '@/lib/supabase';

const emptyForm = {
  title: '',
  description: '',
  media_url: '',
  media_type: 'image' as GalleryMediaType,
  thumbnail_url: '',
  alt_text: '',
  source_url: '',
  is_published: true,
  display_order: 0,
};

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryMedia | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('media_gallery')
      .select('*')
      .order('display_order')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setItems((data as GalleryMedia[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (item: GalleryMedia) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? '',
      media_url: item.media_url,
      media_type: item.media_type,
      thumbnail_url: item.thumbnail_url ?? '',
      alt_text: item.alt_text ?? '',
      source_url: item.source_url ?? '',
      is_published: item.is_published,
      display_order: item.display_order,
    });
    setError(null);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      media_url: form.media_url.trim(),
      media_type: form.media_type,
      thumbnail_url: form.thumbnail_url.trim() || null,
      alt_text: form.alt_text.trim() || form.title.trim(),
      source_url: form.source_url.trim() || null,
      is_published: form.is_published,
      display_order: Number(form.display_order) || 0,
    };
    const { error: saveError } = editing
      ? await supabase.from('media_gallery').update(payload).eq('id', editing.id)
      : await supabase.from('media_gallery').insert(payload);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setOpen(false);
    await load();
  };

  const remove = async (item: GalleryMedia) => {
    if (!confirm(`Delete “${item.title}” from the gallery?`)) return;
    const { error: deleteError } = await supabase.from('media_gallery').delete().eq('id', item.id);
    if (reportMutationError('delete this gallery item', deleteError)) return;

    const mediaPath = storagePathFromPublicUrl(item.media_url, 'resource-media');
    const thumbnailPath = item.thumbnail_url
      ? storagePathFromPublicUrl(item.thumbnail_url, 'resource-media')
      : null;
    const paths = [mediaPath, thumbnailPath].filter((path): path is string => Boolean(path));
    if (paths.length > 0) await supabase.storage.from('resource-media').remove(paths);
    await load();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Media Gallery</h1>
          <p className="text-sm text-ink-500">Upload and publish images or videos on the public gallery.</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Media
        </button>
      </div>

      {error && !open ? <Alert type="error" message={error} /> : null}

      {items.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No gallery media yet. Upload the first item.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="card overflow-hidden">
              {item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  poster={item.thumbnail_url ?? undefined}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-ink-950 object-cover"
                />
              ) : (
                <img src={item.media_url} alt={item.alt_text ?? item.title} loading="lazy" className="aspect-video w-full object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.media_type === 'video' ? 'accent' : 'primary'}>
                        {item.media_type === 'video' ? <Video className="h-3 w-3" /> : <Images className="h-3 w-3" />}
                        {item.media_type}
                      </Badge>
                      <Badge variant={item.is_published ? 'success' : 'neutral'}>
                        {item.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {item.is_published ? 'Published' : 'Hidden'}
                      </Badge>
                    </div>
                    <h2 className="mt-3 font-heading font-semibold text-ink-900">{item.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.description || 'No description'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEdit(item)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100" aria-label={`Edit ${item.title}`}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void remove(item)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-600" aria-label={`Delete ${item.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Gallery Media' : 'Add Gallery Media'} size="lg">
        <form onSubmit={save} className="space-y-4">
          {error ? <Alert type="error" message={error} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gallery-title">Title *</label>
              <input id="gallery-title" className="input" required minLength={2} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="gallery-type">Media type *</label>
              <select id="gallery-type" className="input" value={form.media_type} onChange={(event) => setForm({ ...form, media_type: event.target.value as GalleryMediaType })}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gallery-description">Description</label>
            <textarea id="gallery-description" className="input min-h-24" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="label" htmlFor="gallery-url">Media URL *</label>
              <MediaUpload
                bucket="resource-media"
                folder="gallery"
                accept={form.media_type === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
                allowedTypes={form.media_type === 'image' ? IMAGE_TYPES : GALLERY_MEDIA_TYPES.filter((type) => type.startsWith('video/'))}
                maxBytes={form.media_type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024}
                label={`Upload ${form.media_type}`}
                onUploaded={(media_url) => setForm({ ...form, media_url })}
                onError={setError}
              />
            </div>
            <input id="gallery-url" className="input" type="url" required value={form.media_url} onChange={(event) => setForm({ ...form, media_url: event.target.value })} placeholder="Upload a file or paste an HTTPS URL" />
          </div>
          {form.media_type === 'video' ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label" htmlFor="gallery-thumbnail">Video thumbnail (optional)</label>
                <MediaUpload bucket="resource-media" folder="gallery/thumbnails" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} label="Upload thumbnail" onUploaded={(thumbnail_url) => setForm({ ...form, thumbnail_url })} onError={setError} />
              </div>
              <input id="gallery-thumbnail" className="input" type="url" value={form.thumbnail_url} onChange={(event) => setForm({ ...form, thumbnail_url: event.target.value })} />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gallery-alt">Alternative text</label>
              <input id="gallery-alt" className="input" value={form.alt_text} onChange={(event) => setForm({ ...form, alt_text: event.target.value })} placeholder="Describe the image for accessibility" />
            </div>
            <div>
              <label className="label" htmlFor="gallery-order">Display order</label>
              <input id="gallery-order" className="input" type="number" min="0" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: Number(event.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gallery-source">Source URL (optional)</label>
            <input id="gallery-source" className="input" type="url" value={form.source_url} onChange={(event) => setForm({ ...form, source_url: event.target.value })} />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 text-sm font-medium text-ink-700">
            <input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} className="h-4 w-4" />
            Publish this item on the public gallery
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save Gallery Media</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
