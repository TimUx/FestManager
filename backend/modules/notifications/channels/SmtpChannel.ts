import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { decryptValue, isEncryptedValue } from '../../../src/platform/settings/SettingsEncryption';
import type { NotificationConfig } from '../config';
import type { ChannelHealthResult, ChannelSendResult, NotificationChannel, NotificationMessage } from '../NotificationChannel';

function resolveSmtpPass(pass: unknown): string {
  if (typeof pass !== 'string') return '';
  return isEncryptedValue(pass) ? decryptValue(pass) : pass;
}

function createTransporter(config: NotificationConfig): Transporter | null {
  const smtp = config.smtp;
  const host = String(smtp.host ?? '').trim();
  if (!host) return null;
  const port = Number(smtp.port ?? 587);
  const user = String(smtp.user ?? '').trim();
  const pass = resolveSmtpPass(smtp.pass);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
}

export class SmtpChannel implements NotificationChannel {
  readonly id = 'email' as const;
  readonly label = 'E-Mail (SMTP)';

  isConfigured(config: NotificationConfig): boolean {
    return Boolean(config.smtp.enabled && String(config.smtp.host ?? '').trim());
  }

  async send(config: NotificationConfig, message: NotificationMessage): Promise<ChannelSendResult> {
    if (!message.recipientEmail) {
      return { ok: false, error: 'Keine Empfänger-E-Mail' };
    }
    const transporter = createTransporter(config);
    if (!transporter) {
      return { ok: false, error: 'SMTP nicht konfiguriert' };
    }
    const from = String(config.smtp.from ?? '').trim() || 'noreply@verein.local';
    try {
      await transporter.sendMail({
        from,
        to: message.recipientEmail,
        subject: message.title,
        text: message.body,
        html: message.html ?? message.body,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'SMTP-Versand fehlgeschlagen' };
    }
  }

  async testConnection(config: NotificationConfig): Promise<ChannelHealthResult> {
    const transporter = createTransporter(config);
    if (!transporter) {
      return { ok: false, message: 'SMTP-Host fehlt' };
    }
    try {
      await transporter.verify();
      return { ok: true, message: 'SMTP-Verbindung erfolgreich' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Verbindung fehlgeschlagen' };
    }
  }
}
