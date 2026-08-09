import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import MediaUpload from '@/components/MediaUpload';
import { IMAGE_TYPES, storagePathFromPublicUrl } from '@/lib/media';

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
    avatar_url: profile?.avatar_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      location: profile?.location ?? '',
      bio: profile?.bio ?? '',
      avatar_url: profile?.avatar_url ?? '',
    });
    setAvatarError(false);
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, full_name: form.full_name.trim() })
      .eq('id', user.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return;
    const previousUrl = form.avatar_url;
    setSavingAvatar(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl || null })
      .eq('id', user.id);

    if (updateError) {
      const uploadedPath = avatarUrl ? storagePathFromPublicUrl(avatarUrl, 'profile-images') : null;
      if (uploadedPath) await supabase.storage.from('profile-images').remove([uploadedPath]);
      setError(updateError.message);
      setSavingAvatar(false);
      return;
    }

    setForm((current) => ({ ...current, avatar_url: avatarUrl }));
    setAvatarError(false);
    await refreshProfile();

    const previousPath = previousUrl ? storagePathFromPublicUrl(previousUrl, 'profile-images') : null;
    if (previousPath && previousUrl !== avatarUrl) {
      const { error: removeError } = await supabase.storage.from('profile-images').remove([previousPath]);
      if (removeError) console.warn('[CCC] Previous profile image cleanup failed:', removeError.message);
    }

    setSavingAvatar(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">My Profile</h1>
        <p className="mt-1 text-ink-500">Manage your personal information</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 border-b border-ink-100 pb-6">
          {form.avatar_url && !avatarError ? (
            <img src={form.avatar_url} alt="Profile" className="h-16 w-16 rounded-full object-cover" onError={() => setAvatarError(true)} />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-primary-700 font-heading text-2xl font-bold">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div>
            <p className="font-heading text-lg font-semibold text-ink-900">{profile?.full_name}</p>
            <p className="text-sm text-ink-500">{profile?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-secondary-600">{profile?.role}</span>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          {success && <Alert type="success" message="Profile updated successfully!" />}
          {error && <Alert type="error" message={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Profile Image</label>
              <div className="flex flex-wrap items-center gap-2">
                <MediaUpload
                  bucket="profile-images"
                  folder={user?.id ?? ''}
                  accept="image/jpeg,image/png,image/webp"
                  allowedTypes={IMAGE_TYPES}
                  maxBytes={5 * 1024 * 1024}
                  label={savingAvatar ? 'Saving Image' : 'Upload Image'}
                  disabled={savingAvatar || !user}
                  onUploaded={(avatarUrl) => { void updateAvatar(avatarUrl); }}
                  onError={setError}
                />
                {form.avatar_url && (
                  <button type="button" disabled={savingAvatar} className="btn-ghost btn-sm" onClick={() => { void updateAvatar(''); }}>
                    {savingAvatar ? 'Saving...' : 'Remove'}
                  </button>
                )}
                <span className="text-xs text-ink-500">JPG, PNG or WebP. Maximum 5 MB.</span>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[100px]" placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
