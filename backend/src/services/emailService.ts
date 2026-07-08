import { getNotificationServiceRegistry } from '../core/extensionPoints';
import { logger } from '../utils/logger';

/** E-Mail-Versand delegiert ausschließlich an das Benachrichtigungsmodul (H3). */
export const emailService = {
  async sendOrderConfirmation(
    email: string,
    order: {
      id: string;
      displayNumber: string;
      totalPrice: number;
      eventDateLabel?: string;
      items: { name: string; quantity: number; lineTotal: number }[];
      cancellationDeadlineLabel?: string;
    },
    club: {
      clubName: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
    }
  ) {
    if (await getNotificationServiceRegistry().isAvailable()) {
      await getNotificationServiceRegistry().sendOrderConfirmation(email, order, club);
      return;
    }
    logger.warn('Benachrichtigungsmodul nicht aktiv – E-Mail nicht versendet. Bitte Modul „Benachrichtigungen“ aktivieren.');
  },

  async sendOrderCancellation(
    email: string,
    order: {
      id: string;
      displayNumber: string;
      totalPrice: number;
      eventDateLabel?: string;
      items: { name: string; quantity: number; lineTotal: number }[];
      cancelledAtLabel?: string;
    },
    club: {
      clubName: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
    },
    options: { initiatedByStaff?: boolean } = {}
  ) {
    if (await getNotificationServiceRegistry().isAvailable()) {
      await getNotificationServiceRegistry().sendOrderCancellation(email, order, club, options);
      return;
    }
    logger.warn('Benachrichtigungsmodul nicht aktiv – Stornierungs-E-Mail nicht versendet.');
  },
};
