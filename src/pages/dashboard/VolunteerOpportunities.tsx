import { ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VolunteerOpportunities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Volunteer Opportunities</h1>
        <p className="mt-1 text-sm text-ink-500">Browse available volunteer roles and opportunities at CCC.</p>
      </div>
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-ink-900">Opportunities Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Volunteer opportunities will be listed here as they become available. Check back soon or
          contact us to express interest.
        </p>
        <Link to="/volunteer" className="btn-primary mt-6 text-sm">
          Express Interest <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
