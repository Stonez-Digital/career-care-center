/**
 * Seasonal Santa schedule.
 * Dates are interpreted in Africa/Lagos and both endpoints are inclusive.
 * Update this single configuration for each Christmas season.
 */
export const SEASONAL_SANTA_CONFIG = {
  timeZone: 'Africa/Lagos',
  startsOn: '2026-12-01',
  endsOn: '2027-01-31',
} as const;

function lagosDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SEASONAL_SANTA_CONFIG.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function getLagosDateKey(date: Date): string {
  const parts = lagosDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isSeasonalSantaVisibleAt(date: Date): boolean {
  const localDate = getLagosDateKey(date);
  return localDate >= SEASONAL_SANTA_CONFIG.startsOn
    && localDate <= SEASONAL_SANTA_CONFIG.endsOn;
}

/** Milliseconds until the next midnight in Africa/Lagos. */
export function millisecondsUntilNextLagosMidnight(date: Date): number {
  const parts = lagosDateParts(date);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  const milliseconds = date.getUTCMilliseconds();

  return Math.max(
    1,
    ((23 - hour) * 3_600 + (59 - minute) * 60 + (60 - second)) * 1_000
      - milliseconds,
  );
}
