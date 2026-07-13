import { describe, expect, it } from 'vitest';
import {
  formatValidationSummary,
  mapApiValidationErrors,
  minLengthHint,
  validateTenantApplicationForm,
} from './tenantApplicationValidation';

const validForm = {
  organization: 'Testverein',
  organizationType: 'Verein',
  contactName: 'Max Mustermann',
  street: 'Hauptstr 1',
  postalCode: '12345',
  city: 'Musterstadt',
  country: 'Deutschland',
  email: 'max@example.com',
  phone: '',
  website: '',
  memberCount: '',
  eventsPerYear: '',
  reason: 'Wir brauchen FestSchmiede für unser jährliches Sommerfest mit vielen Gästen.',
  desiredFeatures: 'Online-Bestellung und Küchenmonitor',
  freeTierJustification: 'Als gemeinnütziger Verein haben wir kein Budget für Software.',
  plannedUsage: 'Einmal jährlich beim Sommerfest',
  notes: '',
  requestedSubdomain: 'test-verein',
  privacyAccepted: true,
  termsAccepted: true,
};

describe('tenantApplicationValidation', () => {
  it('reports min-length errors with field context', () => {
    const errors = validateTenantApplicationForm(
      { ...validForm, reason: 'zu kurz' },
      { requestedSubdomain: 'test-verein', privacyAccepted: true, termsAccepted: true }
    );
    expect(errors.reason).toContain('20 Zeichen');
  });

  it('maps API validation details to labeled field errors', () => {
    const errors = mapApiValidationErrors([
      { field: 'reason', message: 'Bitte ausführlicher begründen (mindestens 20 Zeichen)' },
    ]);
    expect(errors.reason).toContain('Warum wird FestSchmiede benötigt?');
  });

  it('builds a readable summary for multiple errors', () => {
    const summary = formatValidationSummary({
      reason: 'Fehler A',
      email: 'Fehler B',
    });
    expect(summary).toContain('2 Felder');
  });

  it('shows progress in min-length hint', () => {
    expect(minLengthHint('abc', 20)).toContain('3 von mind. 20');
  });
});
