export type PrintTemplate = 'kitchen' | 'receipt' | 'pickup';

export interface OrderPrintPayload {
  id: string;
  orderNumber: number;
  displayNumber: string;
  eventId: string;
  eventDateLabel?: string;
  source: string;
  totalPrice: number;
  items: { name: string; quantity: number; lineTotal?: number }[];
  customer?: { firstName?: string; lastName?: string } | null;
}

export interface PrinterService {
  isAvailable(): Promise<boolean>;
  printKitchenTicket(payload: OrderPrintPayload): Promise<void>;
  printReceipt(payload: OrderPrintPayload): Promise<void>;
}
