import { describe, it, expect } from 'vitest';
import { parsePermissionKeys, userHasPermission } from '../platform/permissions';

describe('parsePermissionKeys', () => {
  it('parses string arrays', () => {
    expect(parsePermissionKeys(['payment.view', 1, 'x'])).toEqual(['payment.view', 'x']);
  });

  it('returns empty for invalid input', () => {
    expect(parsePermissionKeys(null)).toEqual([]);
  });
});

describe('userHasPermission', () => {
  it('grants ADMIN all permissions', () => {
    expect(userHasPermission('ADMIN', [], 'payment.refund')).toBe(true);
  });

  it('checks STAFF permissions', () => {
    expect(userHasPermission('STAFF', ['payment.view'], 'payment.view')).toBe(true);
    expect(userHasPermission('STAFF', ['payment.view'], 'payment.refund')).toBe(false);
  });
});
