import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from 'lucide-react';
import Alert from '@/components/Alert';
import MediaUpload from '@/components/MediaUpload';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/lib/auth';
import { IMAGE_TYPES, storagePathFromPublicUrl } from '@/lib/media';
import { supabase } from '@/lib/supabase';

type ProfileForm = {
  full_name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
};

const emptyForm: ProfileForm = {
  full_name: '',
  phone: '',
  location: '',
  bio: '',
  avatar_url: '',
};

export default function AdminProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess(false);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const fullName = form.full_name.trim();
    if (!fullName) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
        bio: form.bio.trim() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
      setSuccess(true);
    }
    setSaving(false);
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
      if (removeError) console.warn('[CCC] Previous admin profile image cleanup failed:', removeError.message);
    }

    setSavingAvatar(false);
    setSuccess(true);
  };

  const roleLabel = profile?.role === 'super_admin' ? 'Super Administrator' : 'Administrator';
  const initial = profile?.full_name?.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Administrator Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your personal details and profile image.</p>
      </div>

      {success ? <Alert type="success" message="Your profile has been updated successfully." /> : null}
      {error ? <Alert type="error" message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="card h-fit overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary-700 to-primary-500" />
          <div className="px-6 pb-6 text-center">
            <div className="-mt-12 mb-3 flex justify-center">
              {form.avatar_url && !avatarError ? (
                <img
                  src={form.avatar_url}
                  alt={`${profile?.full_name ?? 'Administrator'} profile`}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-soft"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-white bg-primary-50 font-heading text-3xl font-bold text-primary-700 shadow-soft">
                  {initial}
                </div>
              )}
            </div>
            <h2 className="font-heading text-lg font-bold text-ink-900">{profile?.full_name || 'Administrator'}</h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-primary-700">
              <ShieldCheck className="h-4 w-4" /> {roleLabel}
            </div>
            <div className="mt-5 space-y-3 border-t border-ink-100 pt-5 text-left text-sm text-ink-600">
              <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-ink-400" /> <span className="truncate">{profile?.email}</span></p>
              {form.phone ? <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-ink-400" /> {form.phone}</p> : null}
              {form.location ? <p className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-ink-400" /> {form.location}</p> : null}
            </div>
          </div>
        </aside>

        <section className="card p-6" aria-labelledby="profile-details-heading">
          <div className="mb-6 flex items-center gap-3 border-b border-ink-100 pb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="profile-details-heading" className="font-heading text-lg font-semibold text-ink-900">Profile details</h2>
              <p className="text-sm text-ink-500">Information associated with your administrator account.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-full-name" className="label">Full name</label>
                <input id="admin-full-name" className="input" autoComplete="name" required value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} />
              </div>
              <div>
                <label htmlFor="admin-email" className="label">Email address</label>
                <input id="admin-email" className="input bg-ink-50 text-ink-500" type="email" value={profile?.email ?? user?.email ?? ''} readOnly aria-describedby="admin-email-help" />
                <p id="admin-email-help" className="mt-1.5 text-xs text-ink-400">Email changes are managed through account authentication.</p>
              </div>
              <div>
                <label htmlFor="admin-phone" className="label">Phone number</label>
                <input id="admin-phone" className="input" type="tel" autoComplete="tel" placeholder="Enter phone number" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
              </div>
              <div>
                <label htmlFor="admin-location" className="label">Location</label>
                <input id="admin-location" className="input" autoComplete="address-level2" placeholder="City, State" value={form.location} onChange={(event) => updateField('location', event.target.value)} />
              </div>
            </div>

            <div>
              <span className="label">Profile image</span>
              <div className="flex flex-wrap items-center gap-2">
                <MediaUpload
                  bucket="profile-images"
                  folder={user?.id ?? ''}
                  accept="image/jpeg,image/png,image/webp"
                  allowedTypes={IMAGE_TYPES}
                  maxBytes={5 * 1024 * 1024}
                  label={savingAvatar ? 'Saving image' : 'Upload image'}
                  disabled={savingAvatar || !user}
                  onUploaded={(url) => { void updateAvatar(url); }}
                  onError={setError}
                />
                {form.avatar_url ? (
                  <button type="button" className="btn-ghost btn-sm" disabled={savingAvatar} onClick={() => { void updateAvatar(''); }}>
                    Remove image
                  </button>
                ) : null}
                <span className="text-xs text-ink-400">JPG, PNG, or WebP up to 5 MB.</span>
              </div>
            </div>

            <div>
              <label htmlFor="admin-bio" className="label">Bio</label>
              <textarea id="admin-bio" className="input min-h-32 resize-y" maxLength={500} placeholder="Share a short professional bio..." value={form.bio} onChange={(event) => updateField('bio', event.target.value)} />
              <p className="mt-1.5 text-right text-xs text-ink-400">{form.bio.length}/500</p>
            </div>

            <div className="flex justify-end border-t border-ink-100 pt-5">
              <button type="submit" className="btn-primary" disabled={saving || savingAvatar}>
                {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
