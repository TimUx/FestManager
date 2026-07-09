import { describe, it, expect, beforeEach } from 'vitest';
import { corsPolicy } from '../middleware/corsPolicy';
import { DEFAULT_PLATFORM_CONTEXT } from '../platform/tenant/types';

describe('corsPolicy', () => {
  beforeEach(() => {
    corsPolicy.bindFromPlatform(DEFAULT_PLATFORM_CONTEXT, {
      corsOrigins: ['https://festmanager.org'],
      allowWildcardSubdomains: true,
    });
  });

  it('allows explicit origins from platform settings', () => {
    expect(corsPolicy.isAllowed('https://festmanager.org')).toBe(true);
  });

  it('allows tenant subdomains', () => {
    expect(corsPolicy.isAllowed('https://asv-libelle.festmanager.org')).toBe(true);
  });

  it('allows localhost in development', () => {
    expect(corsPolicy.isAllowed('http://localhost:5173')).toBe(true);
  });

  it('rejects unknown origins', () => {
    expect(corsPolicy.isAllowed('https://evil.example.com')).toBe(false);
  });
});
