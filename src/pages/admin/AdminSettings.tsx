import { useEffect, useState } from 'react';
import { Building2, Share2, Search, LayoutTemplate, FileText as FooterIcon, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SiteSetting } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';
import { cn } from '@/lib/utils';

type Tab = 'organization' | 'social' | 'seo' | 'hero' | 'footer';

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'organization', label: 'Organization Info', icon: Building2 },
  { key: 'social', label: 'Social Links', icon: Share2 },
  { key: 'seo', label: 'SEO Settings', icon: Search },
  { key: 'hero', label: 'Hero Content', icon: LayoutTemplate },
  { key: 'footer', label: 'Footer Content', icon: FooterIcon },
];

const settingKeys = [
  'org_name', 'org_tagline', 'org_email', 'org_phone', 'org_address', 'org_website',
  'social_facebook', 'social_instagram', 'social_linkedin', 'social_whatsapp',
  'hero_title', 'hero_subtitle', 'hero_description',
  'footer_text',
  'seo_meta_title', 'seo_meta_description',
] as const;

type SettingsState = Record<string, string>;

const tabFields: Record<Tab, { key: string; label: string; type?: 'text' | 'textarea' }[]> = {
  organization: [
    { key: 'org_name', label: 'Organization Name' },
    { key: 'org_tagline', label: 'Tagline' },
    { key: 'org_email', label: 'Email' },
    { key: 'org_phone', label: 'Phone' },
    { key: 'org_address', label: 'Address', type: 'textarea' },
    { key: 'org_website', label: 'Website' },
  ],
  social: [
    { key: 'social_facebook', label: 'Facebook URL' },
    { key: 'social_instagram', label: 'Instagram URL' },
    { key: 'social_linkedin', label: 'LinkedIn URL' },
    { key: 'social_whatsapp', label: 'WhatsApp URL' },
  ],
  seo: [
    { key: 'seo_meta_title', label: 'Meta Title' },
    { key: 'seo_meta_description', label: 'Meta Description', type: 'textarea' },
  ],
  hero: [
    { key: 'hero_title', label: 'Hero Title' },
    { key: 'hero_subtitle', label: 'Hero Subtitle' },
    { key: 'hero_description', label: 'Hero Description', type: 'textarea' },
  ],
  footer: [
    { key: 'footer_text', label: 'Footer Text', type: 'textarea' },
  ],
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('organization');
  const [settings, setSettings] = useState<SettingsState>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('*');
      const state: SettingsState = {};
      (data as SiteSetting[] | null)?.forEach((s) => {
        state[s.key] = s.value ?? '';
      });
      // Ensure all keys exist
      settingKeys.forEach((k) => {
        if (!(k in state)) state[k] = '';
      });
      setSettings(state);
      setLoading(false);
    })();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert(upserts, { onConflict: 'key' });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <PageLoader />;

  const fields = tabFields[tab];

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {saved && <Alert type="success" message="Settings saved successfully." />}

      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Manage website content and configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          {(() => {
            const t = tabs.find((t) => t.key === tab)!;
            return (
              <>
                <t.icon className="h-5 w-5 text-primary-700" />
                <h2 className="font-heading text-lg font-semibold text-ink-900">{t.label}</h2>
              </>
            );
          })()}
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="input min-h-[100px] resize-y"
                  value={settings[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  className="input"
                  type="text"
                  value={settings[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? <Spinner className="h-4 w-4" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
