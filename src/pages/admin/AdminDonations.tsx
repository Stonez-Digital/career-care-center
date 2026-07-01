import { useEffect, useState } from 'react';
import { Heart, TrendingUp, Download, MessageSquare, EyeOff, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Donation } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatCurrency, formatDate, exportToCSV } from '@/lib/utils';

export default function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
      setDonations((data as Donation[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const total = donations.filter((d) => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
  const pending = donations.filter((d) => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
  const monthly = donations
    .filter((d) => d.frequency === 'monthly' && d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0);
  const anonymousCount = donations.filter((d) => d.is_anonymous).length;
  const identifiedCount = donations.length - anonymousCount;

  const handleExport = () => {
    exportToCSV(
      'donations',
      donations.map((d) => ({
        'Donor Name': d.is_anonymous ? 'Anonymous Donor' : d.donor_name,
        Email: d.is_anonymous ? '' : d.donor_email,
        Amount: d.amount,
        Currency: d.currency,
        Frequency: d.frequency.replace('_', ' '),
        Status: d.status,
        Anonymous: d.is_anonymous ? 'Yes' : 'No',
        Message: d.message ?? '',
        Date: formatDate(d.created_at),
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Donations</h1>
          <p className="text-sm text-ink-500">{donations.length} total donations</p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-success-50 text-success-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">{formatCurrency(total)}</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">Total Completed</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning-50 text-warning-600">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">{formatCurrency(pending)}</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">Pending</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">{formatCurrency(monthly)}</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">Monthly Recurring</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary-50 text-secondary-600">
              <EyeOff className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">{anonymousCount}</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">Anonymous Donations</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-600">
              <UserCircle className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">{identifiedCount}</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">Identified Donations</p>
        </div>
      </div>

      {/* Donations table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Donor Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Frequency</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {d.is_anonymous ? (
                        <span className="flex items-center gap-1.5 text-secondary-600">
                          <EyeOff className="h-3.5 w-3.5" /> Anonymous Donor
                        </span>
                      ) : (
                        d.donor_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{d.is_anonymous ? '—' : d.donor_email}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(d.amount, d.currency)}</td>
                    <td className="px-4 py-3 capitalize text-ink-600">{d.frequency.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          d.status === 'completed' ? 'success' : d.status === 'pending' ? 'warning' : 'error'
                        }
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(d.created_at)}</td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {d.message ? (
                        <div className="flex items-start gap-1.5 text-ink-600">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                          <span className="line-clamp-2">{d.message}</span>
                        </div>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
