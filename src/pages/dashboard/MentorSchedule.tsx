import { CalendarClock } from 'lucide-react';

export default function MentorSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Schedule</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your mentoring availability and schedule.</p>
      </div>
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
          <CalendarClock className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-ink-900">No Schedule Set</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Set your availability so mentees can book sessions with you. Your schedule will appear
          here once configured.
        </p>
      </div>
    </div>
  );
}
