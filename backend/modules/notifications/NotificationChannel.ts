import type { NotificationChannelId, NotificationConfig, NotificationEventType } from './config';

export interface NotificationMessage {
  title: string;
  body: string;
  html?: string;
  recipientEmail?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}

export interface ChannelSendResult {
  ok: boolean;
  error?: string;
}

export interface ChannelHealthResult {
  ok: boolean;
  message?: string;
}

export interface NotificationChannel {
  readonly id: NotificationChannelId;
  readonly label: string;
  isConfigured(config: NotificationConfig): boolean;
  send(config: NotificationConfig, message: NotificationMessage): Promise<ChannelSendResult>;
  testConnection?(config: NotificationConfig): Promise<ChannelHealthResult>;
}

export function isChannelEnabledForEvent(
  config: NotificationConfig,
  event: NotificationEventType,
  channelId: NotificationChannelId
): boolean {
  return Boolean(config.events[event]?.[channelId]);
}
