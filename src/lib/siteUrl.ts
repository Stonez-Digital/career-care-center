const productionSiteUrl = 'https://app.careercarecenter.com.ng';

export function getSiteUrl() {
  if (import.meta.env.DEV) return window.location.origin;

  return (import.meta.env.VITE_SITE_URL || productionSiteUrl).replace(/\/$/, '');
}
