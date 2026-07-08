export type PaymentStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_PAID'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_TIMEOUT'
  | 'PAYMENT_REFUNDED'
  | 'ORDER_CONFIRMED'
  | 'IN_KITCHEN'
  | 'READY'
  | 'COLLECTED';

export interface PublicPaymentMethod {
  methodId: string;
  displayName: string;
  description: string;
  supportedMethods: string[];
  checkoutType: 'redirect' | 'embedded' | 'offline';
  icon?: string;
  sortOrder: number;
  recommended?: boolean;
}

export interface PaymentMethodsResponse {
  allowCashOnSite: boolean;
  methods: PublicPaymentMethod[];
}

export type PaymentChoiceId = 'cash' | string;

export interface PaymentOption {
  type: 'cash' | 'online';
  id: PaymentChoiceId;
  label: string;
  description?: string;
  recommended?: boolean;
  icon?: string;
}

export interface PaymentSelectionState {
  options: PaymentOption[];
  showSelection: boolean;
  defaultChoice: PaymentChoiceId;
}

export interface OrderPaymentInfo {
  required: boolean;
  checkoutUrl: string;
  sessionId: string;
  paymentStatus?: PaymentStatus;
  expiresAt?: string;
}

export interface PaymentStatusInfo {
  sessionId: string;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  resourceType: string;
  resourceId: string;
  checkoutUrl?: string;
  expiresAt?: string;
  paidAt?: string;
  releasedToKitchen: boolean;
}
