import { useEffect, useState } from 'react';
import { CalendarClock, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

export default function MentorSchedule() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from('mentor_profiles').select('availability, is_available').eq('user_id', user.id).maybeSingle().then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      if (data) {
        setAvailability(data.availability ?? '');
        setIsAvailable(data.is_available);
      }
      setLoading(false);
    });
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const existing = await supabase.from('mentor_profiles').select('id').eq('user_id', user.id).maybeSingle();
    const result = existing.data
      ? await supabase.from('mentor_profiles').update({ availability: availability.trim(), is_available: isAvailable }).eq('id', existing.data.id)
      : await supabase.from('mentor_profiles').insert({ user_id: user.id, availability: availability.trim(), is_available: isAvailable });

    setSaving(false);
    if (result.error) setError(result.error.message);
    else setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Mentor Availability</h1>
        <p className="mt-1 text-sm text-ink-500">Tell administrators when they can schedule your Microsoft Teams sessions.</p>
      </div>
      <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
        {error && <Alert type="error" message={error} />}
        {saved && <Alert type="success" message="Your availability has been updated." />}
        <label className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 p-4">
          <span>
            <span className="block font-medium text-ink-900">Accepting sessions</span>
            <span className="block text-sm text-ink-500">Allow administrators to select you for new sessions.</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-primary-700" checked={isAvailable} disabled={loading} onChange={(event) => { setIsAvailable(event.target.checked); setSaved(false); }} />
        </label>
        <div>
          <label className="label" htmlFor="mentor-availability">Available days and times</label>
          <textarea
            id="mentor-availability"
            className="input min-h-[130px]"
            maxLength={1000}
            disabled={loading}
            placeholder="Example: Mondays and Wednesdays, 4:00 PM to 7:00 PM (West Africa Time)"
            value={availability}
            onChange={(event) => { setAvailability(event.target.value); setSaved(false); }}
          />
          <p className="mt-1 text-xs text-ink-500">Include your time zone and any dates when you are unavailable.</p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading || saving}>
          {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save Availability</>}
        </button>
      </form>
    </div>
  );
}
