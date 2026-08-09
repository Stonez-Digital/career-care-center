import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Mail, Phone, MapPin, Clock, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Volunteer, VolunteerStatus } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, cn, exportToCSV } from '@/lib/utils';
import { reportMutationError } from '@/lib/mutations';

const statusVariant: Record<VolunteerStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

type Tab = 'all' | VolunteerStatus;

export default function AdminVolunteers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('filter') as Tab) ?? 'all';
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab);

  const load = async () => {
    const { data } = await supabase.from('volunteers').select('*').order('created_at', { ascending: false });
    setVolunteers((data as Volunteer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setTab((searchParams.get('filter') as Tab) ?? 'all');
  }, [searchParams]);

  const updateStatus = async (id: string, status: VolunteerStatus) => {
    const { error } = await supabase.from('volunteers').update({ status }).eq('id', id);
    if (reportMutationError(`mark this volunteer as ${status}`, error)) return;
    load();
  };

  const handleExport = () => {
    exportToCSV(
      'volunteers',
      volunteers.map((v) => ({
        Name: v.name,
        Email: v.email,
        Phone: v.phone,
        Skills: v.skills.join('; '),
        Availability: v.availability,
        Location: v.location,
        Motivation: v.motivation,
        Status: v.status,
        'Applied At': formatDate(v.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  const filtered = tab === 'all' ? volunteers : volunteers.filter((v) => v.status === tab);
  const tabs: Tab[] = ['all', 'pending', 'approved', 'rejected'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Volunteers</h1>
          <p className="text-sm text-ink-500">
            {volunteers.length} applications · {volunteers.filter((v) => v.status === 'pending').length} pending
          </p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
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

      {/* Volunteer cards */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No volunteer applications.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((v) => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary-50 font-bold text-secondary-600">
                    {v.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-ink-900">{v.name}</h3>
                    <p className="text-sm text-ink-500">Applied {formatDate(v.created_at)}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[v.status]}>{v.status}</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Mail className="h-4 w-4 shrink-0 text-ink-400" /> <span className="truncate">{v.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Phone className="h-4 w-4 shrink-0 text-ink-400" /> {v.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-400" /> {v.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Clock className="h-4 w-4 shrink-0 text-ink-400" /> {v.availability}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {v.skills.map((s) => (
                    <Badge key={s} variant="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Motivation</p>
                <p className="mt-1 text-sm text-ink-600">{v.motivation}</p>
              </div>

              {v.status === 'pending' && (
                <div className="mt-4 flex gap-2 border-t border-ink-100 pt-3">
                  <button
                    onClick={() => updateStatus(v.id, 'approved')}
                    className="btn-secondary text-sm"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(v.id, 'rejected')}
                    className="btn-outline text-sm text-error-600 hover:bg-error-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
