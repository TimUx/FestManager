import type { FeatureContext } from '../../src/module-system/types';
import type { ClubContactData, OrderEmailData } from '../../src/platform/extension-points/NotificationService';
import { CORE_CLUB_NAMESPACE } from '../../src/platform/settings/SettingsNamespaces';
import { logger } from '../../src/utils/logger';
import type { NotificationConfig, NotificationEventType } from './config';
import { isChannelEnabledForEvent, type NotificationMessage } from './NotificationChannel';
import { notificationRegistry } from './NotificationRegistry';
import {
  buildKitchenCompletedMessage,
  buildOrderCancellationMessage,
  buildOrderConfirmationMessage,
  buildOrderPaidMessage,
} from './services/EmailTemplateService';

type OrderHookPayload = {
  id: string;
  displayNumber: string;
  totalPrice: number;
  eventDateLabel?: string;
  items?: { name?: string; quantity: number; lineTotal?: number }[];
  customer?: { email?: string | null } | null;
};

async function loadClubContact(context: FeatureContext): Promise<ClubContactData> {
  const values = await context.settings.getDecryptedValues(CORE_CLUB_NAMESPACE);
  return {
    clubName: String(values.clubName ?? 'Verein'),
    contactName: (values.contactName as string | undefined) ?? undefined,
    email: (values.email as string | undefined) ?? undefined,
    phone: (values.phone as string | undefined) ?? undefined,
    address: (values.address as string | undefined) ?? undefined,
  };
}

class NotificationManager {
  private async loadConfig(context: FeatureContext): Promise<NotificationConfig> {
    return context.getConfig<NotificationConfig>('notifications');
  }

  async hasActiveChannel(context: FeatureContext): Promise<boolean> {
    const config = await this.loadConfig(context);
    return notificationRegistry.getConfigured(config).length > 0;
  }

  async runHealthChecks(context: FeatureContext): Promise<Record<string, { ok: boolean; message?: string }>> {
    const config = await this.loadConfig(context);
    const results: Record<string, { ok: boolean; message?: string }> = {};
    for (const channel of notificationRegistry.getAll()) {
      if (!channel.isConfigured(config)) {
        results[channel.id] = { ok: false, message: 'Nicht konfiguriert' };
        continue;
      }
      if (channel.testConnection) {
        results[channel.id] = await channel.testConnection(config);
      } else {
        results[channel.id] = { ok: true, message: 'Bereit' };
      }
    }
    return results;
  }

  async testChannel(context: FeatureContext, channelId: string) {
    const channel = notificationRegistry.get(channelId);
    if (!channel?.testConnection) {
      return { ok: false, message: 'Kanal nicht gefunden' };
    }
    const config = await this.loadConfig(context);
    return channel.testConnection(config);
  }

  private async dispatch(
    context: FeatureContext,
    event: NotificationEventType,
    message: NotificationMessage
  ): Promise<void> {
    const config = await this.loadConfig(context);
    const tasks = notificationRegistry.getAll()
      .filter((channel) => isChannelEnabledForEvent(config, event, channel.id))
      .filter((channel) => channel.isConfigured(config))
      .map(async (channel) => {
        const result = await channel.send(config, message);
        if (result.ok) {
          logger.info(`Benachrichtigung [${event}/${channel.id}]: ${message.title}`);
        } else {
          logger.warn(`Benachrichtigung fehlgeschlagen [${event}/${channel.id}]: ${result.error}`);
        }
      });
    await Promise.allSettled(tasks);
  }

  async sendOrderConfirmation(
    context: FeatureContext,
    email: string,
    order: OrderEmailData,
    club: ClubContactData
  ): Promise<void> {
    const config = await this.loadConfig(context);
    const template = buildOrderConfirmationMessage(order, club, config.emailCustomText);
    await this.dispatch(context, 'orderCreated', {
      ...template,
      recipientEmail: email,
      priority: 'normal',
    });
  }

  async sendOrderCancellation(
    context: FeatureContext,
    email: string,
    order: OrderEmailData,
    club: ClubContactData,
    options?: { initiatedByStaff?: boolean }
  ): Promise<void> {
    const config = await this.loadConfig(context);
    const template = buildOrderCancellationMessage(order, club, options, config.emailCustomText);
    await this.dispatch(context, 'orderCancelled', {
      ...template,
      recipientEmail: email,
      priority: 'normal',
    });
  }

  async handleOrderPaid(context: FeatureContext, payload: OrderHookPayload): Promise<void> {
    const club = await loadClubContact(context);
    const order: OrderEmailData = {
      id: payload.id,
      displayNumber: payload.displayNumber,
      totalPrice: payload.totalPrice,
      eventDateLabel: payload.eventDateLabel,
      items: (payload.items ?? []).map((i) => ({
        name: i.name ?? 'Artikel',
        quantity: i.quantity,
        lineTotal: i.lineTotal ?? 0,
      })),
    };
    const template = buildOrderPaidMessage(order, club);
    await this.dispatch(context, 'orderPaid', {
      ...template,
      recipientEmail: payload.customer?.email ?? undefined,
      priority: 'high',
    });
  }

  async handleKitchenCompleted(context: FeatureContext, payload: OrderHookPayload): Promise<void> {
    const template = buildKitchenCompletedMessage({
      displayNumber: payload.displayNumber,
      totalPrice: payload.totalPrice,
      eventDateLabel: payload.eventDateLabel,
    });
    await this.dispatch(context, 'kitchenCompleted', {
      ...template,
      priority: 'high',
    });
  }
}

export const notificationManager = new NotificationManager();
