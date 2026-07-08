import type { PaymentConfig } from './config';
import type { PaymentMethodInfo } from './types';
import { paymentRegistry } from './PaymentRegistry';
import { PaymentFactory } from './PaymentFactory';
import { toPaymentMethodInfo } from './providerMetadata';

export const METHOD_TYPE_DEFS: Record<string, { id: string; label: string; icon?: string }[]> = {
  stripe: [
    { id: 'card', label: 'Kreditkarte', icon: 'credit-card' },
    { id: 'apple_pay', label: 'Apple Pay', icon: 'apple' },
    { id: 'google_pay', label: 'Google Pay', icon: 'google' },
    { id: 'link', label: 'Link', icon: 'link' },
    { id: 'klarna', label: 'Klarna', icon: 'klarna' },
  ],
  paypal: [{ id: 'paypal', label: 'PayPal', icon: 'paypal' }],
  'vr-payment': [{ id: 'sepa', label: 'SEPA', icon: 'bank' }],
  's-payment': [{ id: 'giropay', label: 'Online-Banking', icon: 'bank' }],
  payone: [
    { id: 'card', label: 'Kreditkarte', icon: 'credit-card' },
    { id: 'paypal', label: 'PayPal', icon: 'paypal' },
    { id: 'sepa', label: 'SEPA', icon: 'bank' },
  ],
  sumup: [{ id: 'card', label: 'Kreditkarte', icon: 'credit-card' }],
};

export function providerConfigKey(providerId: string): keyof PaymentConfig {
  const map: Record<string, keyof PaymentConfig> = {
    stripe: 'stripe',
    paypal: 'paypal',
    'vr-payment': 'vrPayment',
    's-payment': 'sPayment',
    payone: 'payone',
    sumup: 'sumup',
  };
  return map[providerId] ?? 'stripe';
}

export function parsePaymentMethodId(methodId?: string): { providerId?: string; methodType?: string } {
  if (!methodId) return {};
  const [providerId, methodType] = methodId.split(':');
  return { providerId, methodType: methodType || undefined };
}

export function buildEnabledPaymentMethods(config: PaymentConfig): PaymentMethodInfo[] {
  PaymentFactory.registerAll();
  const methodTypes = config.methodTypes ?? {};
  const methods: PaymentMethodInfo[] = [];

  for (const provider of paymentRegistry.getAll()) {
    if (!provider.implemented || !provider.isConfigured(config)) continue;

    const key = providerConfigKey(provider.id);
    const section = config[key] as { enabled?: boolean } | undefined;
    if (section?.enabled === false) continue;

    const defs = METHOD_TYPE_DEFS[provider.id] ?? [];
    const baseMeta = toPaymentMethodInfo(provider, {
      recommended: provider.id === config.defaultProvider,
    });

    if (defs.length === 0) {
      methods.push(baseMeta);
      continue;
    }

    for (const def of defs) {
      const typeKey = `${provider.id}:${def.id}`;
      const override = methodTypes[typeKey];
      const enabled = override?.enabled ?? true;
      if (!enabled) continue;

      methods.push({
        ...baseMeta,
        displayName: def.label,
        description: override?.description ?? baseMeta.description,
        icon: override?.icon ?? def.icon ?? baseMeta.icon,
        sortOrder: override?.sortOrder ?? baseMeta.sortOrder,
        recommended: override?.recommended ?? false,
        supportedPaymentMethods: [def.id],
        providerId: typeKey,
      });
    }
  }

  methods.sort((a, b) => a.sortOrder - b.sortOrder);
  if (methods.length > 0 && !methods.some((m) => m.recommended)) {
    methods[0].recommended = true;
  }
  return methods;
}
