import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Program, ProgramCategory } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES } from '@/lib/media';
import { reportMutationError } from '@/lib/mutations';

const categories: ProgramCategory[] = [
  'Career Coaching', 'Career Mentorship', 'Internship Support', 'Internship Placement',
  'CV Review', 'LinkedIn Optimization', 'Entrepreneurship Development', 'Skills Development',
  'Digital Skills Training', 'Career Assessment', 'Employability Skills Training',
  'Leadership Development', 'Graduate Employability', 'Job Readiness',
  'Youth Empowerment', 'Professional Development',
];

const empty = { title: '', category: 'Career Coaching' as ProgramCategory, description: '', benefits: '', requirements: '', duration: '', image_url: '', is_active: true };

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    setPrograms((data as Program[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setModal(true); setError(null); };
  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({ title: p.title, category: p.category, description: p.description, benefits: p.benefits.join(', '), requirements: p.requirements.join(', '), duration: p.duration ?? '', image_url: p.image_url ?? '', is_active: p.is_active });
    setModal(true); setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      title: form.title, category: form.category, description: form.description,
      benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
      requirements: form.requirements.split(',').map((s) => s.trim()).filter(Boolean),
      duration: form.duration || null, image_url: form.image_url || null, is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('programs').update(payload).eq('id', editing.id)
      : await supabase.from('programs').insert(payload);
    setSaving(false);
    if (error) setError(error.message);
    else { setModal(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (reportMutationError('delete this program', error)) return;
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Programs</h1>
          <p className="text-sm text-ink-500">{programs.length} programs</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm"><Plus className="h-4 w-4" /> New Program</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between">
              <Badge variant="primary">{p.category}</Badge>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="mt-3 font-heading font-semibold text-ink-900">{p.title}</h3>
            <p className="mt-1 text-sm text-ink-600 line-clamp-2">{p.description}</p>
            {p.duration && <p className="mt-2 text-xs text-ink-400">{p.duration}</p>}
            <div className="mt-3">
              <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Program' : 'New Program'} size="lg">
        <form onSubmit={save} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Title *</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProgramCategory })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description *</label><textarea className="input min-h-[80px]" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Benefits (comma-separated)</label><input className="input" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></div>
            <div><label className="label">Requirements (comma-separated)</label><input className="input" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Duration</label><input className="input" placeholder="e.g. 6 weeks" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Image URL</label>
                <MediaUpload bucket="resource-media" folder="programs" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} label="Upload Image" onUploaded={(image_url) => setForm({ ...form, image_url })} onError={setError} />
              </div>
              <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input type="checkbox" className="h-4 w-4 rounded" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible to public)
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save</>}</button>
        </form>
      </Modal>
    </div>
  );
}
