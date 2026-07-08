export interface OrderEmailData {
  id: string;
  displayNumber: string;
  totalPrice: number;
  eventDateLabel?: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  cancellationDeadlineLabel?: string;
  cancelledAtLabel?: string;
}

export interface ClubContactData {
  clubName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface NotificationService {
  isAvailable(): Promise<boolean>;
  sendOrderConfirmation(email: string, order: OrderEmailData, club: ClubContactData): Promise<void>;
  sendOrderCancellation(
    email: string,
    order: OrderEmailData,
    club: ClubContactData,
    options?: { initiatedByStaff?: boolean }
  ): Promise<void>;
}
