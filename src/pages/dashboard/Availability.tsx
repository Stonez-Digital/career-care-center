import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Spinner from '@/components/Spinner';
import { PageLoader } from '@/components/Spinner';
import Alert from '@/components/Alert';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const slots = ['Morning', 'Afternoon', 'Evening'];

export default function Availability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from('volunteer_availability')
      .select('slots')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message);
        const selected = ((data?.slots as string[] | undefined) ?? []).reduce<Record<string, boolean>>((result, slot) => {
          result[slot] = true;
          return result;
        }, {});
        setAvailability(selected);
        setLoading(false);
      });
  }, [user]);

  const toggle = (key: string) => {
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const selectedSlots = Object.entries(availability).filter(([, selected]) => selected).map(([slot]) => slot);
    const { error: saveError } = await supabase.from('volunteer_availability').upsert({
      user_id: user.id,
      slots: selectedSlots,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (saveError) setError(saveError.message);
    else setSaved(true);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Availability</h1>
        <p className="mt-1 text-sm text-ink-500">Set your available days and times for volunteering.</p>
      </div>
      <form onSubmit={save} className="card p-6">
        {saved && <Alert type="success" message="Availability updated successfully." className="mb-4" />}
        {error && <Alert type="error" message={error} className="mb-4" />}
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
