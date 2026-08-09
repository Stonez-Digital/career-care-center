import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, Eye, EyeOff, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reportMutationError } from '@/lib/mutations';
import type { BlogPost } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import { slugify, formatDate, exportToCSV } from '@/lib/utils';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES } from '@/lib/media';

const empty = {
  title: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  author: 'CCC Team',
  category: 'General',
  meta_title: '',
  meta_description: '',
  is_draft: true,
  published: false,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setModal(true);
    setError(null);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      cover_image_url: p.cover_image_url ?? '',
      author: p.author,
      category: p.category,
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
      is_draft: p.is_draft,
      published: p.published,
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
      slug: slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      author: form.author,
      category: form.category,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      is_draft: form.is_draft,
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert(payload);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setModal(false);
      load();
    }
  };

  const togglePublish = async (p: BlogPost) => {
    const nowPublished = !p.published;
    await supabase
      .from('blog_posts')
      .update({
        published: nowPublished,
        published_at: nowPublished ? new Date().toISOString() : null,
        is_draft: nowPublished ? false : p.is_draft,
      })
      .eq('id', p.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (reportMutationError('delete this post', error)) return;
    load();
  };

  const handleExport = () => {
    exportToCSV(
      'blog-posts',
      posts.map((p) => ({
        Title: p.title,
        Slug: p.slug,
        Category: p.category,
        Author: p.author,
        Excerpt: p.excerpt,
        Status: p.published ? 'Published' : p.is_draft ? 'Draft' : 'Unpublished',
        'Published At': p.published_at ? formatDate(p.published_at) : '',
        'Created At': formatDate(p.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Blog Management</h1>
          <p className="text-sm text-ink-500">
            {posts.length} posts · {posts.filter((p) => p.published).length} published
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={openNew} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="card p-12 text-center text-ink-500">No posts yet. Create your first post.</div>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="card flex items-center gap-4 p-4">
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt={p.title}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-400">
                  <Edit className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{p.category}</Badge>
                  {p.published ? (
                    <Badge variant="success">Published</Badge>
                  ) : p.is_draft ? (
                    <Badge variant="warning">Draft</Badge>
                  ) : (
                    <Badge variant="neutral">Unpublished</Badge>
                  )}
                </div>
                <h3 className="mt-1 truncate font-heading font-semibold text-ink-900">{p.title}</h3>
                <p className="truncate text-sm text-ink-500">{p.excerpt}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  by {p.author} · {p.published_at ? `Published ${formatDate(p.published_at)}` : `Created ${formatDate(p.created_at)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => togglePublish(p)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
                  title={p.published ? 'Unpublish' : 'Publish'}
                >
                  {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Post' : 'New Post'} size="xl">
        <form onSubmit={save} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Post title"
              />
              {form.title && (
                <p className="mt-1 text-xs text-ink-400">
                  Slug: <span className="font-mono">{slugify(form.title)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="label">Category</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Excerpt *</label>
            <input
              className="input"
              required
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Short summary"
            />
          </div>
          <div>
            <label className="label">Content * (Markdown supported)</label>
            <textarea
              className="input min-h-[240px] font-mono text-sm"
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your post content here..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Author</label>
              <input
                className="input"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Cover Image URL</label>
                <MediaUpload bucket="resource-media" folder="blog" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} label="Upload Cover" onUploaded={(cover_image_url) => setForm({ ...form, cover_image_url })} onError={setError} />
              </div>
              <input
                className="input"
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Meta Title</label>
              <input
                className="input"
                value={form.meta_title}
                onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                placeholder="SEO title"
              />
            </div>
            <div>
              <label className="label">Meta Description</label>
              <input
                className="input"
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                placeholder="SEO description"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={form.is_draft}
                onChange={(e) => setForm({ ...form, is_draft: e.target.checked })}
              />
              Save as draft
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publish
            </label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
