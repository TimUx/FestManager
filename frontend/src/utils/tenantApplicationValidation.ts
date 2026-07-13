import type { TenantApplicationInput } from '@/types/tenant';

export type TenantApplicationFormKey =
  | 'organization'
  | 'organizationType'
  | 'contactName'
  | 'street'
  | 'postalCode'
  | 'city'
  | 'country'
  | 'email'
  | 'phone'
  | 'website'
  | 'memberCount'
  | 'eventsPerYear'
  | 'reason'
  | 'desiredFeatures'
  | 'freeTierJustification'
  | 'plannedUsage'
  | 'notes'
  | 'requestedSubdomain'
  | 'privacyAccepted'
  | 'termsAccepted';

export const TENANT_APPLICATION_FIELD_LABELS: Record<string, string> = {
  organization: 'Organisation',
  organizationType: 'Organisationstyp',
  contactName: 'Ansprechpartner',
  street: 'Straße',
  postalCode: 'PLZ',
  city: 'Ort',
  country: 'Land',
  email: 'E-Mail',
  phone: 'Telefon',
  website: 'Website',
  memberCount: 'Anzahl Mitglieder',
  eventsPerYear: 'Veranstaltungen pro Jahr',
  reason: 'Warum wird FestSchmiede benötigt?',
  desiredFeatures: 'Welche Funktionen sollen genutzt werden?',
  freeTierJustification: 'Warum sollte ein kostenloser Mandant bereitgestellt werden?',
  plannedUsage: 'Geplante Nutzung',
  notes: 'Bemerkungen',
  requestedSubdomain: 'Gewünschte Internetadresse',
  privacyAccepted: 'Datenschutzerklärung',
  termsAccepted: 'Nutzungsbedingungen',
};

type FieldRule = {
  minLength?: number;
  maxLength?: number;
  helperText?: string;
};

export const TENANT_APPLICATION_FIELD_RULES: Partial<Record<TenantApplicationFormKey, FieldRule>> = {
  organization: { minLength: 2, maxLength: 200 },
  organizationType: { minLength: 2 },
  contactName: { minLength: 2, maxLength: 120 },
  street: { minLength: 2, maxLength: 200 },
  postalCode: { minLength: 3, maxLength: 20 },
  city: { minLength: 2, maxLength: 100 },
  email: { helperText: 'Gültige E-Mail-Adresse eingeben' },
  website: { helperText: 'Optional, z. B. www.mein-verein.de (https:// wird ergänzt)' },
  reason: { minLength: 20, maxLength: 5000 },
  desiredFeatures: { minLength: 10, maxLength: 3000 },
  freeTierJustification: { minLength: 20, maxLength: 3000 },
  plannedUsage: { minLength: 10, maxLength: 3000 },
  notes: { maxLength: 3000 },
  requestedSubdomain: {
    minLength: 3,
    maxLength: 48,
    helperText: 'Mindestens 3 Zeichen, nur Buchstaben, Zahlen und Bindestriche',
  },
};

export type TenantApplicationFieldErrors = Partial<Record<TenantApplicationFormKey, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function minLengthHint(value: string, minLength: number, maxLength?: number): string {
  const count = value.trim().length;
  const range = maxLength ? `${minLength}–${maxLength}` : `mind. ${minLength}`;
  if (count < minLength) {
    return `${count} von ${range} Zeichen – bitte noch etwas ausführlicher`;
  }
  return `${count} Zeichen (${range})`;
}

export function resolveFieldHelperText(
  key: TenantApplicationFormKey,
  value: string,
  fieldError?: string,
  extraHelper?: string
): string | undefined {
  if (fieldError) return fieldError;
  const rule = TENANT_APPLICATION_FIELD_RULES[key];
  if (rule?.minLength) return minLengthHint(value, rule.minLength, rule.maxLength);
  return extraHelper ?? rule?.helperText;
}

function isValidWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return Boolean(new URL(normalized).hostname);
  } catch {
    return false;
  }
}

export interface ValidateTenantApplicationOptions {
  requestedSubdomain: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
}

export function validateTenantApplicationForm(
  form: Record<TenantApplicationFormKey, string | boolean>,
  options: ValidateTenantApplicationOptions
): TenantApplicationFieldErrors {
  const errors: TenantApplicationFieldErrors = {};

  const requireMin = (key: TenantApplicationFormKey, value: string, min: number, message: string) => {
    if (value.trim().length < min) errors[key] = message;
  };

  requireMin('organization', String(form.organization), 2, 'Organisation: mindestens 2 Zeichen');
  requireMin('organizationType', String(form.organizationType), 2, 'Organisationstyp erforderlich');
  requireMin('contactName', String(form.contactName), 2, 'Ansprechpartner: mindestens 2 Zeichen');
  requireMin('street', String(form.street), 2, 'Straße: mindestens 2 Zeichen');
  requireMin('postalCode', String(form.postalCode), 3, 'PLZ: mindestens 3 Zeichen');
  requireMin('city', String(form.city), 2, 'Ort: mindestens 2 Zeichen');

  const email = String(form.email).trim();
  if (!email) errors.email = 'E-Mail ist erforderlich';
  else if (!EMAIL_RE.test(email)) errors.email = 'Ungültige E-Mail-Adresse';

  const website = String(form.website).trim();
  if (website && !isValidWebsite(website)) {
    errors.website = 'Ungültige Website – bitte z. B. www.mein-verein.de eingeben';
  }

  const memberCount = String(form.memberCount).trim();
  if (memberCount && (!Number.isFinite(Number(memberCount)) || Number(memberCount) < 0)) {
    errors.memberCount = 'Anzahl Mitglieder darf nicht negativ sein';
  }

  const eventsPerYear = String(form.eventsPerYear).trim();
  if (eventsPerYear && (!Number.isFinite(Number(eventsPerYear)) || Number(eventsPerYear) < 0)) {
    errors.eventsPerYear = 'Veranstaltungen pro Jahr darf nicht negativ sein';
  }

  requireMin('reason', String(form.reason), 20, 'Bitte ausführlicher begründen (mindestens 20 Zeichen)');
  requireMin('desiredFeatures', String(form.desiredFeatures), 10, 'Bitte gewünschte Funktionen angeben (mindestens 10 Zeichen)');
  requireMin(
    'freeTierJustification',
    String(form.freeTierJustification),
    20,
    'Bitte Begründung angeben (mindestens 20 Zeichen)'
  );
  requireMin('plannedUsage', String(form.plannedUsage), 10, 'Geplante Nutzung angeben (mindestens 10 Zeichen)');

  const notes = String(form.notes);
  if (notes.length > 3000) errors.notes = 'Bemerkungen: maximal 3000 Zeichen';

  if (options.requestedSubdomain.length < 3) {
    errors.requestedSubdomain = 'Internetadresse: mindestens 3 Zeichen';
  } else if (!/^[a-z0-9-]+$/.test(options.requestedSubdomain)) {
    errors.requestedSubdomain = 'Nur Buchstaben, Zahlen und Bindestriche erlaubt';
  }

  if (!options.privacyAccepted) errors.privacyAccepted = 'Datenschutzerklärung muss akzeptiert werden';
  if (!options.termsAccepted) errors.termsAccepted = 'Nutzungsbedingungen müssen akzeptiert werden';

  return errors;
}

export function mapApiValidationErrors(
  details: Array<{ field: string; message: string }>
): TenantApplicationFieldErrors {
  const errors: TenantApplicationFieldErrors = {};
  for (const detail of details) {
    const key = detail.field as TenantApplicationFormKey;
    const label = TENANT_APPLICATION_FIELD_LABELS[detail.field] ?? detail.field;
    errors[key] = `${label}: ${detail.message}`;
  }
  return errors;
}

export function formatValidationSummary(errors: TenantApplicationFieldErrors): string {
  const messages = Object.values(errors);
  if (messages.length === 0) return 'Bitte korrigieren Sie die markierten Felder.';
  if (messages.length === 1) return messages[0]!;
  return `Bitte korrigieren Sie ${messages.length} Felder: ${messages.join(' · ')}`;
}

export function buildTenantApplicationPayload(
  form: Record<TenantApplicationFormKey, string | boolean>,
  requestedSubdomain: string,
  normalizeWebsite: (value: string) => string | undefined,
  parseOptionalInt: (value: string) => number | undefined,
  botProtection: { formStartedAt: number; honeypot: string; turnstileToken?: string }
): TenantApplicationInput {
  return {
    organization: String(form.organization).trim(),
    organizationType: String(form.organizationType),
    contactName: String(form.contactName).trim(),
    street: String(form.street).trim(),
    postalCode: String(form.postalCode).trim(),
    city: String(form.city).trim(),
    country: String(form.country).trim() || undefined,
    email: String(form.email).trim(),
    phone: String(form.phone).trim() || undefined,
    website: form.website ? normalizeWebsite(String(form.website)) : undefined,
    memberCount: parseOptionalInt(String(form.memberCount)),
    eventsPerYear: parseOptionalInt(String(form.eventsPerYear)),
    reason: String(form.reason).trim(),
    desiredFeatures: String(form.desiredFeatures).trim(),
    freeTierJustification: String(form.freeTierJustification).trim(),
    plannedUsage: String(form.plannedUsage).trim(),
    notes: String(form.notes).trim() || undefined,
    requestedSubdomain,
    privacyAccepted: true,
    termsAccepted: true,
    formStartedAt: botProtection.formStartedAt,
    _hp: botProtection.honeypot,
    turnstileToken: botProtection.turnstileToken,
  };
}
