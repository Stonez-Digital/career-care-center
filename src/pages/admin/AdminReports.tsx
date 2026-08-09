import { useEffect, useState } from 'react';
import {
  Users, ClipboardList, Calendar, HandCoins, Heart, Mail,
  Download, BarChart3, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import { formatCurrency, exportToCSV, cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalApplications: number;
  totalEvents: number;
  totalDonations: number;
  totalVolunteers: number;
  totalContactMessages: number;
}

interface ExportConfig {
  label: string;
  table: string;
  filename: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}

const exportConfigs: ExportConfig[] = [
  { label: 'Applications', table: 'applications', filename: 'applications', icon: ClipboardList, bg: 'bg-primary-50', text: 'text-primary-700' },
  { label: 'Users', table: 'profiles', filename: 'users', icon: Users, bg: 'bg-secondary-50', text: 'text-secondary-700' },
  { label: 'Events', table: 'events', filename: 'events', icon: Calendar, bg: 'bg-accent-50', text: 'text-accent-600' },
  { label: 'Volunteers', table: 'volunteers', filename: 'volunteers', icon: Heart, bg: 'bg-success-50', text: 'text-success-700' },
  { label: 'Donations', table: 'donations', filename: 'donations', icon: HandCoins, bg: 'bg-warning-50', text: 'text-warning-600' },
  { label: 'Contact Messages', table: 'contact_messages', filename: 'contact-messages', icon: Mail, bg: 'bg-error-50', text: 'text-error-600' },
];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalApplications: 0,
    totalEvents: 0,
    totalDonations: 0,
    totalVolunteers: 0,
    totalContactMessages: 0,
  });
  const [monthlyApps, setMonthlyApps] = useState<{ month: string; applications: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [users, apps, events, donations, volunteers, messages] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('amount, status'),
        supabase.from('volunteers').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
      ]);

      const donationTotal = (donations.data ?? [])
        .filter((d: any) => d.status === 'completed')
        .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

      setStats({
        totalUsers: users.count ?? 0,
        totalApplications: apps.count ?? 0,
        totalEvents: events.count ?? 0,
        totalDonations: donationTotal,
        totalVolunteers: volunteers.count ?? 0,
        totalContactMessages: messages.count ?? 0,
      });

      // Monthly applications (last 6 months)
      const months: { month: string; applications: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        months.push({ month: monthName, applications: 0 });
      }
      const { data: allApps } = await supabase
        .from('applications')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      (allApps ?? []).forEach((a: any) => {
        const d = new Date(a.created_at);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const m = months.find((m) => m.month === monthName);
        if (m) m.applications++;
      });
      setMonthlyApps(months);

      setLoading(false);
    })();
  }, []);

  const handleExport = async (cfg: ExportConfig) => {
    setExporting(cfg.table);
    const { data } = await supabase.from(cfg.table).select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      exportToCSV(cfg.filename, data as Record<string, any>[]);
    }
    setExporting(null);
  };

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'from-primary-500 to-primary-700' },
    { label: 'Total Applications', value: stats.totalApplications, icon: ClipboardList, bg: 'from-secondary-400 to-secondary-600' },
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, bg: 'from-accent-400 to-accent-500' },
    { label: 'Total Donations', value: formatCurrency(stats.totalDonations), icon: HandCoins, bg: 'from-success-500 to-success-600' },
    { label: 'Total Volunteers', value: stats.totalVolunteers, icon: Heart, bg: 'from-warning-400 to-warning-600' },
    { label: 'Contact Messages', value: stats.totalContactMessages, icon: Mail, bg: 'from-ink-600 to-ink-800' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Reports & Analytics</h1>
        <p className="text-sm text-ink-500">Platform summary and data exports</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={cn('mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft', s.bg)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-700" />
          <h2 className="font-heading text-lg font-semibold text-ink-900">Applications by Month</h2>
        </div>
        <p className="text-sm text-ink-500">Application volume over the last 6 months</p>
        <ResponsiveContainer width="100%" height={300} className="mt-4">
          <BarChart data={monthlyApps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }}
              cursor={{ fill: 'rgba(15, 76, 129, 0.05)' }}
            />
            <Bar dataKey="applications" fill="#0F4C81" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Export section */}
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-700" />
          <h2 className="font-heading text-lg font-semibold text-ink-900">Data Exports</h2>
        </div>
        <p className="text-sm text-ink-500">Download CSV exports for each category</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exportConfigs.map((cfg) => (
            <button
              key={cfg.table}
              onClick={() => handleExport(cfg)}
              disabled={exporting === cfg.table}
              className="flex items-center gap-3 rounded-xl border border-ink-100 p-4 text-left transition-all hover:border-primary-200 hover:shadow-soft disabled:opacity-50"
            >
              <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', cfg.bg, cfg.text)}>
                <cfg.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{cfg.label}</p>
                <p className="text-xs text-ink-500">Export to CSV</p>
              </div>
              {exporting === cfg.table ? (
                <span className="text-xs text-primary-700">Exporting...</span>
              ) : (
                <Download className="h-4 w-4 shrink-0 text-ink-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
