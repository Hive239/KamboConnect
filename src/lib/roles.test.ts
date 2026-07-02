import { describe, it, expect } from 'vitest';
import { getRole, roleHome, canAccess } from './roles';

describe('getRole', () => {
  it('maps admin/practitioner exactly', () => {
    expect(getRole({ role: 'admin' })).toBe('admin');
    expect(getRole({ role: 'practitioner' })).toBe('practitioner');
  });
  it('collapses client/legacy/unknown to client', () => {
    expect(getRole({ role: 'client' })).toBe('client');
    expect(getRole({ role: 'user' })).toBe('client');   // legacy value
    expect(getRole({})).toBe('client');
    expect(getRole(null)).toBe('client');
  });
});

describe('roleHome', () => {
  it('sends each role to its home', () => {
    expect(roleHome('admin')).toContain('AdminDashboard');
    expect(roleHome('practitioner')).toContain('PractitionerDashboard');
    expect(roleHome('client')).toContain('Directory');
  });
});

describe('canAccess', () => {
  it('keeps practitioners out of client-only commerce (bookings/directory), but shares Market/Map/Guide', () => {
    // Practitioners are buyers too — Market, Map, Guide and Orders are shared.
    expect(canAccess('Market', 'practitioner')).toBe(true);
    expect(canAccess('Map', 'practitioner')).toBe(true);
    expect(canAccess('Guide', 'practitioner')).toBe(true);
    expect(canAccess('Orders', 'practitioner')).toBe(true);
    // But client-only surfaces stay closed to practitioners.
    expect(canAccess('Bookings', 'practitioner')).toBe(false);
    expect(canAccess('Directory', 'practitioner')).toBe(false);
    expect(canAccess('Market', 'client')).toBe(true);
  });
  it('keeps clients out of practitioner/admin tools', () => {
    expect(canAccess('PractitionerDashboard', 'client')).toBe(false);
    expect(canAccess('Billing', 'client')).toBe(false);
    expect(canAccess('AdminDashboard', 'client')).toBe(false);
    expect(canAccess('PractitionerDashboard', 'practitioner')).toBe(true);
  });
  it('lets admin access everything', () => {
    for (const p of ['Market', 'PractitionerDashboard', 'AdminDashboard', 'Bookings']) {
      expect(canAccess(p, 'admin')).toBe(true);
    }
  });
  it('treats unlisted pages as open to all roles', () => {
    expect(canAccess('Community', 'practitioner')).toBe(true);
    expect(canAccess('Messages', 'client')).toBe(true);
  });
});
