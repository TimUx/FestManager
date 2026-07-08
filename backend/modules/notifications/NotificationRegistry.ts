import { DiscordChannel } from './channels/DiscordChannel';
import { NtfyChannel } from './channels/NtfyChannel';
import { SlackChannel } from './channels/SlackChannel';
import { SmtpChannel } from './channels/SmtpChannel';
import { TeamsChannel } from './channels/TeamsChannel';
import type { NotificationChannel } from './NotificationChannel';

class NotificationRegistry {
  private readonly channels = new Map<string, NotificationChannel>();

  constructor() {
    for (const channel of [
      new SmtpChannel(),
      new NtfyChannel(),
      new DiscordChannel(),
      new SlackChannel(),
      new TeamsChannel(),
    ]) {
      this.channels.set(channel.id, channel);
    }
  }

  get(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  getAll(): NotificationChannel[] {
    return [...this.channels.values()];
  }

  getConfigured(config: import('./config').NotificationConfig): NotificationChannel[] {
    return this.getAll().filter((c) => c.isConfigured(config));
  }
}

export const notificationRegistry = new NotificationRegistry();
