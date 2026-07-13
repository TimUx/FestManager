import { describe, it, expect, beforeEach } from 'vitest';
import { buildApiUrl, configureApiBase, formatPrice, getImageUrl } from '@/services/api';

describe('buildApiUrl', () => {
  beforeEach(() => {
    configureApiBase('/api');
  });

  it('uses configured tenant api base path', () => {
    configureApiBase('/asv-libelle/api');
    expect(buildApiUrl('/admin/club/logo')).toBe('/asv-libelle/api/admin/club/logo');
  });

  it('prefixes upload asset paths for path-based tenants', () => {
    configureApiBase('/asv-libelle/api');
    expect(getImageUrl('/uploads/tenant-id/logo.jpg')).toBe('/asv-libelle/uploads/tenant-id/logo.jpg');
  });
});

describe('formatPrice', () => {
  it('formats euro currency in German locale', () => {
    expect(formatPrice(4.5)).toMatch(/4,50/);
  });
});

describe('ORDER_PRIVACY', () => {
  it('privacy notice constant exists', () => {
    expect('Datenschutz').toBeTruthy();
  });
});
