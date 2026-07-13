import { describe, it, expect } from 'vitest';
import { submitTenantApplicationSchema } from './schemas';

const validBase = {
  organization: 'Test Verein',
  organizationType: 'Verein',
  contactName: 'Max Mustermann',
  street: 'Hauptstr 1',
  postalCode: '12345',
  city: 'Musterstadt',
  email: 'test@example.com',
  reason: 'Wir brauchen FestSchmiede für unser Sommerfest mit vielen Gästen.',
  desiredFeatures: 'Online-Bestellung und Küchenmonitor',
  freeTierJustification: 'Wir sind ein kleiner gemeinnütziger Verein ohne Budget.',
  plannedUsage: 'Einmal jährlich beim Sommerfest',
  requestedSubdomain: 'test-verein',
  privacyAccepted: true,
  termsAccepted: true,
  formStartedAt: Date.now() - 5000,
};

describe('submitTenantApplicationSchema', () => {
  it('accepts bare website domains by adding https', () => {
    const result = submitTenantApplicationSchema.parse({
      ...validBase,
      website: 'www.mein-verein.de',
    });
    expect(result.website).toBe('https://www.mein-verein.de');
  });

  it('normalizes requested subdomain before validation', () => {
    const result = submitTenantApplicationSchema.parse({
      ...validBase,
      requestedSubdomain: 'Mein Verein',
    });
    expect(result.requestedSubdomain).toBe('mein-verein');
  });

  it('truncates decimal member counts to integers', () => {
    const result = submitTenantApplicationSchema.parse({
      ...validBase,
      memberCount: 12.8,
    });
    expect(result.memberCount).toBe(12);
  });
});
