import type { PaymentProvider } from './PaymentProvider';
import type { PaymentMethodInfo } from './types';

/** Benutzerfreundliche Metadaten – keine Providernamen (Spec 6.2). */
const PROVIDER_METADATA: Record<string, Omit<PaymentMethodInfo, 'providerId' | 'recommended'>> = {
  stripe: {
    displayName: 'Online bezahlen',
    description: 'Kreditkarte, Apple Pay, Google Pay',
    supportedPaymentMethods: ['card', 'apple_pay', 'google_pay'],
    checkoutType: 'redirect',
    icon: 'credit-card',
    sortOrder: 10,
  },
  paypal: {
    displayName: 'Online bezahlen',
    description: 'PayPal',
    supportedPaymentMethods: ['paypal'],
    checkoutType: 'redirect',
    icon: 'paypal',
    sortOrder: 20,
  },
  'vr-payment': {
    displayName: 'Online bezahlen',
    description: 'SEPA-Lastschrift',
    supportedPaymentMethods: ['sepa'],
    checkoutType: 'redirect',
    icon: 'bank',
    sortOrder: 30,
  },
  's-payment': {
    displayName: 'Online bezahlen',
    description: 'Online-Banking',
    supportedPaymentMethods: ['giropay', 'card'],
    checkoutType: 'redirect',
    icon: 'bank',
    sortOrder: 40,
  },
  payone: {
    displayName: 'Online bezahlen',
    description: 'Karte oder PayPal',
    supportedPaymentMethods: ['card', 'paypal', 'sepa'],
    checkoutType: 'redirect',
    icon: 'credit-card',
    sortOrder: 50,
  },
  sumup: {
    displayName: 'Online bezahlen',
    description: 'Kreditkarte',
    supportedPaymentMethods: ['card'],
    checkoutType: 'redirect',
    icon: 'credit-card',
    sortOrder: 60,
  },
};

export function toPaymentMethodInfo(
  provider: PaymentProvider,
  options?: { recommended?: boolean }
): PaymentMethodInfo {
  const meta = PROVIDER_METADATA[provider.id] ?? {
    displayName: 'Online bezahlen',
    description: provider.name,
    supportedPaymentMethods: [],
    checkoutType: 'redirect' as const,
    sortOrder: 99,
  };
  return {
    ...meta,
    providerId: provider.id,
    recommended: options?.recommended,
    description: provider.implemented ? meta.description : `${meta.description} (bald verfügbar)`,
  };
}

export function getProviderMetadata(providerId: string): Omit<PaymentMethodInfo, 'providerId' | 'recommended'> | undefined {
  return PROVIDER_METADATA[providerId];
}
