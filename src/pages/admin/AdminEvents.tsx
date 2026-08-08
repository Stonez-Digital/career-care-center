import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, Calendar, MapPin, Users, Video, Download, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CCCEvent, EventRegistration, Profile } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Modal from '@/components/Modal';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, cn, exportToCSV } from '@/lib/utils';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES } from '@/lib/media';
import SafeImage from '@/components/SafeImage';

const eventFallback = '/media/events/workshop-2-reminder.jpg';

const empty = {
  title: '',
  description: '',
  event_date: '',
  location: '',
  image_url: '',
  capacity: '',
  is_virtual: false,
};

type Tab = 'all' | 'upcoming' | 'past';

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('filter') as Tab) ?? 'all';
  const [events, setEvents] = useState<CCCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CCCEvent | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents((data as CCCEvent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setTab((searchParams.get('filter') as Tab) ?? 'all');
  }, [searchParams]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setModal(true);
    setError(null);
  };

  const openEdit = (e: CCCEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description,
      event_date: e.event_date.slice(0, 16),
      location: e.location,
      image_url: e.image_url ?? '',
      capacity: e.capacity?.toString() ?? '',
      is_virtual: e.is_virtual,
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
      event_date: form.event_date,
      location: form.location,
      image_url: form.image_url || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      is_virtual: form.is_virtual,
    };
    const { error } = editing
      ? await supabase.from('events').update(payload).eq('id', editing.id)
      : await supabase.from('events').insert(payload);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setModal(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await supabase.from('events').delete().eq('id', id);
    load();
  };

  const exportRegistrations = async (event: CCCEvent) => {
    setExporting(true);
    const { data } = await supabase
      .from('event_registrations')
      .select('*, profile:profiles(*)')
      .eq('event_id', event.id)
      .order('registered_at', { ascending: false });
    const regs = (data as (EventRegistration & { profile: Profile | null })[]) ?? [];
    exportToCSV(`registrations-${event.title.replace(/\s+/g, '-').toLowerCase()}`, regs.map((r) => ({
      Event: event.title,
      Name: r.profile?.full_name ?? 'Unknown',
      Email: r.profile?.email ?? '',
      Phone: r.profile?.phone ?? '',
      Location: r.profile?.location ?? '',
      'Registered At': formatDate(r.registered_at),
    })));
    setExporting(false);
  };

  if (loading) return <PageLoader />;

  const now = new Date();
  const filtered = events.filter((e) => {
    const eventDate = new Date(e.event_date);
    const matchTab =
      tab === 'all' || (tab === 'upcoming' && eventDate >= now) || (tab === 'past' && eventDate < now);
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabs: Tab[] = ['all', 'upcoming', 'past'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Events</h1>
          <p className="text-sm text-ink-500">{events.length} events</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Event
        </button>
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
      </div>

      {/* Event cards grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No events found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <div key={e.id} className="card overflow-hidden">
              {e.image_url && (
                <SafeImage src={e.image_url} fallbackSrc={eventFallback} alt={e.title} loading="lazy" className="h-32 w-full object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {e.is_virtual ? (
                    <Badge variant="secondary">
                      <Video className="h-3 w-3" /> Virtual
                    </Badge>
                  ) : (
                    <Badge variant="primary">
                      <MapPin className="h-3 w-3" /> In-person
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportRegistrations(e)}
                      disabled={exporting}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700"
                      title="Export registrations"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(e)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-primary-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-error-50 hover:text-error-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-2 font-heading font-semibold text-ink-900">{e.title}</h3>
                <div className="mt-2 space-y-1 text-sm text-ink-500">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(e.event_date)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {e.location}
                  </p>
                  {e.capacity && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {e.capacity} seats
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Event' : 'New Event'} size="lg">
        <form onSubmit={save} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea
              className="input min-h-[80px]"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date &amp; Time *</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location *</label>
              <input
                className="input"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                type="number"
                className="input"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Image URL</label>
                <MediaUpload bucket="resource-media" folder="events" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} label="Upload Image" onUploaded={(image_url) => setForm({ ...form, image_url })} onError={setError} />
              </div>
              <input
                className="input"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.is_virtual}
              onChange={(e) => setForm({ ...form, is_virtual: e.target.checked })}
            />
            Virtual event
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
