import { describe, expect, it } from 'vitest';
import { protectedRouteDestination } from '@/components/ProtectedRoute';
import { mutationErrorMessage } from '@/lib/mutations';
import { isTeamsUrl } from '@/lib/teams';
import { spreadsheetSafeCell } from '@/lib/utils';

describe('Microsoft Teams URL validation', () => {
  it.each([
    'https://teams.microsoft.com/l/meetup-join/example',
    'https://subdomain.teams.microsoft.com/path',
    'https://teams.live.com/meet/example',
  ])('accepts %s', (url) => expect(isTeamsUrl(url)).toBe(true));

  it.each([
    null,
    'http://teams.microsoft.com/insecure',
    'https://teams.microsoft.com.evil.example/path',
    'https://example.com/meeting',
    'not-a-url',
  ])('rejects %s', (url) => expect(isTeamsUrl(url)).toBe(false));
});

describe('protected route decisions', () => {
  it('sends anonymous users to the correct login', () => {
    expect(protectedRouteDestination({ hasUser: false, profileRole: null, metadataRole: null, adminOnly: false })).toBe('/login');
    expect(protectedRouteDestination({ hasUser: false, profileRole: null, metadataRole: null, adminOnly: true })).toBe('/admin/login');
    expect(protectedRouteDestination({ hasUser: false, profileRole: null, metadataRole: null, adminOnly: false, unauthenticatedTo: '/signup' })).toBe('/signup');
  });

  it('requires both trusted metadata and profile roles for admin access', () => {
    expect(protectedRouteDestination({ hasUser: true, profileRole: 'admin', metadataRole: 'intern', adminOnly: true })).toBe('/unauthorized');
    expect(protectedRouteDestination({ hasUser: true, profileRole: 'admin', metadataRole: 'admin', adminOnly: true })).toBeNull();
  });

  it('denies a suspended profile even when both role sources are administrative', () => {
    expect(protectedRouteDestination({
      hasUser: true,
      profileRole: 'admin',
      metadataRole: 'admin',
      profileSuspended: true,
      adminOnly: true,
    })).toBe('/unauthorized');
  });

  it('denies role pages when an authenticated user has no profile', () => {
    expect(protectedRouteDestination({ hasUser: true, profileRole: null, metadataRole: 'intern', adminOnly: false, roles: ['intern'] })).toBe('/unauthorized');
  });
});

describe('mutation error messages', () => {
  it('returns no message on success and an actionable message on failure', () => {
    expect(mutationErrorMessage('save the record', null)).toBeNull();
    expect(mutationErrorMessage('save the record', { message: 'permission denied' })).toBe(
      'Could not save the record. permission denied'
    );
  });
});

describe('spreadsheet export safety', () => {
  it.each(['=HYPERLINK("https://evil.example")', '+cmd', '-1+1', '@SUM(1,1)', '  =1+1', '\t=1+1', '\u00a0@SUM(1,1)'])(
    'neutralizes formula-like cell %s',
    (value) => expect(spreadsheetSafeCell(value)).toBe(`'${value}`),
  );

  it.each(['Ada Lovelace', '123', 'safe@example.com'])(
    'preserves ordinary cell %s',
    (value) => expect(spreadsheetSafeCell(value)).toBe(value),
  );

  it('preserves numeric values, including negative numbers', () => {
    expect(spreadsheetSafeCell(-42)).toBe('-42');
  });
});
