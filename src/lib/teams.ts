const TEAMS_HOSTS = ['teams.microsoft.com', 'teams.live.com'] as const;

export function isTeamsUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === 'https:' && TEAMS_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}
