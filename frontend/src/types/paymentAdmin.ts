export interface PaymentDashboardStats {
  paymentsToday: number;
  revenueTodayCents: number;
  openPayments: number;
  failedPayments: number;
  timeouts: number;
  refunds: number;
}

export interface PaymentProviderAdmin {
  id: string;
  name: string;
  description?: string;
  version?: string;
  implemented: boolean;
  enabled?: boolean;
  configured?: boolean;
  sandbox?: boolean;
  status: string;
  health: { ok: boolean; message?: string };
  supportsRefund?: boolean;
  supportsWebhook?: boolean;
}

export interface PaymentMethodTypeAdmin {
  id: string;
  providerId: string;
  label: string;
  enabled: boolean;
  recommended: boolean;
  sortOrder: number;
  description?: string;
  icon?: string;
  providerConfigured: boolean;
}

export interface PaymentListItem {
  id: string;
  orderNumber?: number | null;
  displayNumber?: string | null;
  amountCents: number;
  currency: string;
  status: string;
  providerId: string;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string | null;
  customerName?: string | null;
  eventId?: string | null;
}

export interface PaymentDashboard {
  stats: PaymentDashboardStats;
  activeProviders: number;
  availableMethods: number;
  providers: PaymentProviderAdmin[];
  webhookStatus: string;
  healthStatus: string;
  recentErrors: { action: string; providerId?: string | null; at: string; details?: unknown }[];
}

export interface PaymentStatistics {
  period: 'today' | 'week' | 'month';
  totalCount: number;
  successCount: number;
  failedCount: number;
  revenueCents: number;
  refundCount: number;
  successRate: number;
  errorRate: number;
  refundRate: number;
  byProvider: { providerId: string; count: number; revenueCents: number }[];
}

export interface PaymentAuditLog {
  id: string;
  paymentId?: string | null;
  action: string;
  providerId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export type PaymentAdminTab =
  | 'overview'
  | 'providers'
  | 'methods'
  | 'settings'
  | 'payments'
  | 'refunds'
  | 'logs'
  | 'webhooks'
  | 'health'
  | 'statistics';

export const PAYMENT_ADMIN_TABS: { id: PaymentAdminTab; label: string; permission?: string }[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'providers', label: 'Provider', permission: 'payment.provider.configure' },
  { id: 'methods', label: 'Zahlungsarten', permission: 'payment.manage' },
  { id: 'settings', label: 'Einstellungen', permission: 'payment.provider.configure' },
  { id: 'payments', label: 'Zahlungen' },
  { id: 'refunds', label: 'Refunds', permission: 'payment.refund' },
  { id: 'logs', label: 'Logs', permission: 'payment.logs' },
  { id: 'webhooks', label: 'Webhooks', permission: 'payment.webhooks' },
  { id: 'health', label: 'Health' },
  { id: 'statistics', label: 'Statistiken', permission: 'payment.statistics' },
];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Erstellt',
  PAYMENT_PENDING: 'Ausstehend',
  PAYMENT_PROCESSING: 'In Bearbeitung',
  PAYMENT_PAID: 'Bezahlt',
  ORDER_CONFIRMED: 'Bestätigt',
  PAYMENT_FAILED: 'Fehlgeschlagen',
  PAYMENT_CANCELLED: 'Abgebrochen',
  PAYMENT_TIMEOUT: 'Zeitüberschreitung',
  pending: 'Ausstehend',
  completed: 'Abgeschlossen',
  failed: 'Fehlgeschlagen',
  cancelled: 'Abgebrochen',
};

export const PROVIDER_STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv',
  sandbox: 'Testmodus',
  deaktiviert: 'Deaktiviert',
  nicht_konfiguriert: 'Nicht konfiguriert',
  nicht_verfuegbar: 'Nicht verfügbar',
  health_fehler: 'Health-Fehler',
};

export const LOG_ACTION_LABELS: Record<string, string> = {
  checkout_created: 'Checkout erstellt',
  webhook_received: 'Webhook empfangen',
  webhook_validated: 'Webhook validiert',
  payment_succeeded: 'Zahlung erfolgreich',
  payment_failed: 'Zahlung fehlgeschlagen',
  refund: 'Rückerstattung',
  timeout: 'Zeitüberschreitung',
  provider_error: 'Anbieterfehler',
  connection_test: 'Verbindungstest',
  checkout_cancelled: 'Checkout abgebrochen',
};
