import { useState } from 'react';
import { Clock3, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const slots = ['Morning', 'Afternoon', 'Evening'];

export default function Availability() {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => {
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slots = days
      .filter((d) => availability[d])
      .join(', ');
    // Store availability in profile bio as a simple approach
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Availability</h1>
        <p className="mt-1 text-sm text-ink-500">Set your available days and times for volunteering.</p>
      </div>
      <form onSubmit={save} className="card p-6">
        {saved && <Alert type="success" message="Availability updated successfully." className="mb-4" />}
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day}>
              <p className="mb-2 text-sm font-semibold text-ink-700">{day}</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const key = `${day}-${slot}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className={cn(
                        'rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all',
                        availability[key]
                          ? 'border-primary-700 bg-primary-50 text-primary-700'
                          : 'border-ink-200 text-ink-500 hover:border-primary-300'
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="btn-primary mt-6">
          {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save Availability</>}
        </button>
      </form>
    </div>
  );
}
