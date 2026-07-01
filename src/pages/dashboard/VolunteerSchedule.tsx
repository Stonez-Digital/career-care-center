import { CalendarCheck } from 'lucide-react';

export default function VolunteerSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Volunteer Schedule</h1>
        <p className="mt-1 text-sm text-ink-500">Your upcoming volunteer commitments.</p>
      </div>
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
          <CalendarCheck className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-ink-900">No Upcoming Commitments</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          You have no scheduled volunteer commitments. Upcoming events will appear here once you are
          assigned to them.
        </p>
      </div>
    </div>
  );
}
