import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Clock, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Application, ApplicationStatus } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate, cn } from '@/lib/utils';

const statusConfig: Record<ApplicationStatus, { variant: 'warning' | 'primary' | 'success' | 'error'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { variant: 'warning', icon: Clock },
  under_review: { variant: 'primary', icon: Loader },
  approved: { variant: 'success', icon: CheckCircle2 },
  rejected: { variant: 'error', icon: XCircle },
};

export default function MyApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('applications')
        .select('*, program:programs(*), logs:application_status_logs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setApps((data as Application[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">My Applications</h1>
          <p className="mt-1 text-ink-500">Track the status of your program applications</p>
        </div>
        <Link to="/apply" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Application
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-ink-300" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-ink-900">No applications yet</h3>
          <p className="mt-2 text-sm text-ink-500">Apply for a program to get started on your career journey.</p>
          <Link to="/apply" className="btn-primary mt-6">Apply Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const cfg = statusConfig[a.status];
            return (
              <div key={a.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-ink-900">{a.program?.title ?? 'Program'}</h3>
                      <p className="mt-0.5 text-sm text-ink-500">Applied on {formatDate(a.created_at)}</p>
                      <p className="mt-0.5 text-xs text-ink-400">Ref: CCC-{a.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>
                    <cfg.icon className="h-3.5 w-3.5" /> {a.status.replace('_', ' ')}
                  </Badge>
                </div>
                {a.logs && a.logs.length > 0 && (
                  <div className="mt-4 border-t border-ink-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Status History</p>
                    <div className="space-y-2">
                      {a.logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-sm">
                          <span className={cn('h-2 w-2 rounded-full',
                            log.status === 'approved' && 'bg-success-500',
                            log.status === 'rejected' && 'bg-error-500',
                            log.status === 'under_review' && 'bg-primary-500',
                            log.status === 'pending' && 'bg-warning-500',
                          )} />
                          <span className="capitalize text-ink-700">{log.status.replace('_', ' ')}</span>
                          <span className="text-ink-400">· {formatDate(log.changed_at)}</span>
                          {log.note && <span className="text-ink-500">— {log.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
