import { config } from '../../../src/config';
import { formatPrice } from '../../../src/utils/helpers';
import type { ClubContactData, OrderEmailData } from '../../../src/platform/extension-points/NotificationService';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCustomEmailBlock(text?: string | null): string {
  const trimmed = text?.trim();
  if (!trimmed) return '';
  const html = escapeHtml(trimmed).replace(/\r?\n/g, '<br>');
  return `<div style="margin: 16px 0; padding: 12px 16px; background: #f5f5f5; border-radius: 4px; line-height: 1.5;">${html}</div>`;
}

function contactLines(club: ClubContactData): string[] {
  return [
    club.contactName && `Ansprechpartner: ${escapeHtml(club.contactName)}`,
    club.email && `E-Mail: ${escapeHtml(club.email)}`,
    club.phone && `Telefon: ${escapeHtml(club.phone)}`,
    club.address && `Adresse: ${escapeHtml(club.address)}`,
  ].filter(Boolean) as string[];
}

export function buildOrderConfirmationMessage(
  order: OrderEmailData,
  club: ClubContactData,
  emailCustomText?: string
) {
  const statusUrl = `${config.corsOrigin.replace(/\/$/, '')}/status/${order.id}`;
  const itemsList = order.items
    .map((i) => `${i.quantity}× ${i.name} – ${formatPrice(i.lineTotal)}`)
    .join('<br>');

  const cancellationNote = order.cancellationDeadlineLabel
    ? `<p>Stornierungen sind bis <strong>${escapeHtml(order.cancellationDeadlineLabel)}</strong> möglich.</p>`
    : '';

  const customBlock = formatCustomEmailBlock(emailCustomText);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
      <h2>Bestellbestätigung</h2>
      ${customBlock}
      <p>Vielen Dank für Ihre Bestellung bei <strong>${escapeHtml(club.clubName)}</strong>!</p>
      <p><strong>Ihre Abholnummer: ${escapeHtml(order.displayNumber)}</strong></p>
      ${order.eventDateLabel ? `<p><strong>Veranstaltungstag:</strong> ${escapeHtml(order.eventDateLabel)}</p>` : ''}
      <p>Bitte merken Sie sich diese Nummer oder zeigen Sie sie am Veranstaltungstag an der Kasse vor.</p>
      <h3>Verkäufer / Verein</h3>
      <p><strong>${escapeHtml(club.clubName)}</strong></p>
      ${contactLines(club).length ? `<p>${contactLines(club).join('<br>')}</p>` : ''}
      <h3>Ihre Bestellung</h3>
      <p>${itemsList}</p>
      <p><strong>Gesamt: ${formatPrice(order.totalPrice)}</strong></p>

      <h3>Rechtliche Hinweise</h3>
      <p style="font-size: 0.9em; line-height: 1.5;">
        Mit Absenden Ihrer Bestellung kommt ein verbindlicher Kaufvertrag zwischen Ihnen und
        ${escapeHtml(club.clubName)} zustande. Die bestellten Speisen werden am Veranstaltungstag
        zur Abholung bereitgestellt. Nicht abgeholte Bestellungen werden gleichwohl in Rechnung
        gestellt, sofern die Bestellung nicht fristgerecht storniert wurde.
        ${order.cancellationDeadlineLabel
          ? ` Die Stornierungsfrist endet am ${escapeHtml(order.cancellationDeadlineLabel)}.`
          : ''}
        Eine Stornierung nach Ablauf der Frist oder nach Bereitstellung der Bestellung ist nicht möglich.
      </p>
      ${cancellationNote}

      <p style="margin-top: 24px;">
        <a href="${statusUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 4px;">
          Bestellstatus anzeigen / stornieren
        </a>
      </p>
      <p style="font-size: 0.85em; color: #666;">
        Direktlink: <a href="${statusUrl}">${statusUrl}</a>
      </p>
    </div>
  `;

  const body = [
    `Bestellbestätigung – Abholnummer ${order.displayNumber}`,
    `Verein: ${club.clubName}`,
    `Gesamt: ${formatPrice(order.totalPrice)}`,
    `Status: ${statusUrl}`,
  ].join('\n');

  return {
    title: `Bestellbestätigung – Abholnummer ${order.displayNumber}`,
    body,
    html,
  };
}

export function buildOrderCancellationMessage(
  order: OrderEmailData,
  club: ClubContactData,
  options: { initiatedByStaff?: boolean } = {},
  emailCustomText?: string
) {
  const statusUrl = `${config.corsOrigin.replace(/\/$/, '')}/status/${order.id}`;
  const itemsList = order.items
    .map((i) => `${i.quantity}× ${i.name} – ${formatPrice(i.lineTotal)}`)
    .join('<br>');

  const introHtml = options.initiatedByStaff
    ? `Ihre Bestellung bei <strong>${escapeHtml(club.clubName)}</strong> wurde storniert.`
    : `Sie haben Ihre Bestellung bei <strong>${escapeHtml(club.clubName)}</strong> erfolgreich storniert.`;

  const customBlock = formatCustomEmailBlock(emailCustomText);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
      <h2>Stornierungsbestätigung</h2>
      ${customBlock}
      <p>${introHtml}</p>
      <p><strong>Abholnummer: ${escapeHtml(order.displayNumber)}</strong></p>
      ${order.eventDateLabel ? `<p><strong>Veranstaltungstag:</strong> ${escapeHtml(order.eventDateLabel)}</p>` : ''}
      ${order.cancelledAtLabel ? `<p><strong>Storniert am:</strong> ${escapeHtml(order.cancelledAtLabel)}</p>` : ''}
      <h3>Stornierte Bestellung</h3>
      <p>${itemsList}</p>
      <p><strong>Gesamtbetrag (storniert): ${formatPrice(order.totalPrice)}</strong></p>
      <h3>Verkäufer / Verein</h3>
      <p><strong>${escapeHtml(club.clubName)}</strong></p>
      ${contactLines(club).length ? `<p>${contactLines(club).join('<br>')}</p>` : ''}
      <h3>Hinweise</h3>
      <p style="font-size: 0.9em; line-height: 1.5;">
        Mit dieser Stornierung ist der zuvor geschlossene Kaufvertrag aufgehoben. Es besteht
        kein Anspruch mehr auf Abholung der bestellten Speisen, und es fallen für diese Bestellung
        keine weiteren Kosten an.
        ${options.initiatedByStaff
          ? ` Falls Sie diese Stornierung nicht veranlasst haben, wenden Sie sich bitte umgehend an ${escapeHtml(club.clubName)}.`
          : ' Bewahren Sie diese E-Mail als Nachweis der Stornierung auf.'}
      </p>
      <p style="margin-top: 24px;">
        <a href="${statusUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 4px;">
          Bestellstatus anzeigen
        </a>
      </p>
      <p style="font-size: 0.85em; color: #666;">
        Direktlink: <a href="${statusUrl}">${statusUrl}</a>
      </p>
    </div>
  `;

  const introText = options.initiatedByStaff
    ? `Ihre Bestellung bei ${club.clubName} wurde storniert.`
    : `Sie haben Ihre Bestellung bei ${club.clubName} erfolgreich storniert.`;

  const body = [
    `Stornierungsbestätigung – Abholnummer ${order.displayNumber}`,
    introText,
    `Gesamtbetrag (storniert): ${formatPrice(order.totalPrice)}`,
  ].join('\n');

  return {
    title: `Stornierungsbestätigung – Abholnummer ${order.displayNumber}`,
    body,
    html,
  };
}

export function buildKitchenCompletedMessage(order: {
  displayNumber: string;
  totalPrice: number;
  eventDateLabel?: string;
}) {
  const title = `Bestellung ${order.displayNumber} fertig`;
  const body = [
    title,
    order.eventDateLabel ? `Veranstaltung: ${order.eventDateLabel}` : '',
    `Gesamt: ${formatPrice(order.totalPrice)}`,
  ].filter(Boolean).join('\n');
  return { title, body };
}

export function buildOrderPaidMessage(order: OrderEmailData, club: ClubContactData) {
  const title = `Zahlung eingegangen – ${order.displayNumber}`;
  const body = [
    title,
    `Verein: ${club.clubName}`,
    `Betrag: ${formatPrice(order.totalPrice)}`,
  ].join('\n');
  return { title, body };
}
