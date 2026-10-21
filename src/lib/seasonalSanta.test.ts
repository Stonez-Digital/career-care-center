import { describe, expect, it } from 'vitest';
import {
  getLagosDateKey,
  isSeasonalSantaVisibleAt,
  millisecondsUntilNextLagosMidnight,
} from './seasonalSanta';

describe('seasonal Santa schedule in Africa/Lagos', () => {
  it('stays hidden immediately before the season starts', () => {
    expect(isSeasonalSantaVisibleAt(new Date('2026-11-30T22:59:59.000Z'))).toBe(false);
  });

  it('appears at midnight on December 1 in Lagos', () => {
    const start = new Date('2026-11-30T23:00:00.000Z');
    expect(getLagosDateKey(start)).toBe('2026-12-01');
    expect(isSeasonalSantaVisibleAt(start)).toBe(true);
  });

  it('remains visible through the final second of January 31 in Lagos', () => {
    const finalSecond = new Date('2027-01-31T22:59:59.000Z');
    expect(getLagosDateKey(finalSecond)).toBe('2027-01-31');
    expect(isSeasonalSantaVisibleAt(finalSecond)).toBe(true);
  });

  it('expires exactly at February 1 midnight in Lagos', () => {
    const expiry = new Date('2027-01-31T23:00:00.000Z');
    expect(getLagosDateKey(expiry)).toBe('2027-02-01');
    expect(isSeasonalSantaVisibleAt(expiry)).toBe(false);
  });

  it('schedules the next Lagos-midnight refresh', () => {
    expect(millisecondsUntilNextLagosMidnight(new Date('2027-01-31T22:30:00.000Z')))
      .toBe(30 * 60 * 1000);
  });
});
